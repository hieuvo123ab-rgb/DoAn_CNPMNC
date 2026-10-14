package com.edms.service;

import ai.djl.huggingface.tokenizers.Encoding;
import ai.djl.huggingface.tokenizers.HuggingFaceTokenizer;
import ai.onnxruntime.OnnxTensor;
import ai.onnxruntime.OrtEnvironment;
import ai.onnxruntime.OrtSession;
import com.edms.config.SemanticConfig;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.stereotype.Service;

import java.nio.LongBuffer;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Phase 12C: Local embedding service using ONNX Runtime.
 *
 * Model: intfloat/multilingual-e5-small (Xenova ONNX int8 quantized)
 * Embedding dimension: 384
 * Languages: 100 (including Vietnamese and English)
 * License: MIT
 *
 * PRIVACY: No network calls at inference time. All computation is local.
 * Raw text is NEVER logged at INFO level.
 *
 * SAFETY: If model is unavailable, isAvailable() returns false.
 * Backend continues running in lexical-only mode.
 */
@Service
public class LocalEmbeddingService {

    private final SemanticConfig config;

    private OrtEnvironment ortEnv;
    private OrtSession ortSession;
    private HuggingFaceTokenizer tokenizer;
    private volatile boolean available = false;
    private String unavailableReason = "Not initialized";

    /** Max token length supported by the model. */
    private static final int MAX_TOKENS = 512;

    public LocalEmbeddingService(SemanticConfig config) {
        this.config = config;
    }

    @PostConstruct
    public void init() {
        try {
            String modelPath = config.getModelPath();
            Path modelDir = Paths.get(modelPath);
            Path modelFile = modelDir.resolve("model.onnx");
            Path tokenizerFile = modelDir.resolve("tokenizer.json");

            if (!Files.exists(modelFile)) {
                unavailableReason = "ONNX model file not found: " + modelFile;
                org.slf4j.LoggerFactory.getLogger(LocalEmbeddingService.class)
                        .warn("[Semantic] Model unavailable: {}", unavailableReason);
                return;
            }
            if (!Files.exists(tokenizerFile)) {
                unavailableReason = "Tokenizer file not found: " + tokenizerFile;
                org.slf4j.LoggerFactory.getLogger(LocalEmbeddingService.class)
                        .warn("[Semantic] Tokenizer unavailable: {}", unavailableReason);
                return;
            }

            // Initialize ONNX Runtime (CPU-only)
            ortEnv = OrtEnvironment.getEnvironment();
            OrtSession.SessionOptions opts = new OrtSession.SessionOptions();
            opts.setIntraOpNumThreads(2);
            opts.setInterOpNumThreads(1);
            ortSession = ortEnv.createSession(modelFile.toString(), opts);

            // Initialize HuggingFace tokenizer (Rust-based, no internet)
            tokenizer = HuggingFaceTokenizer.newInstance(tokenizerFile, null);

            available = true;
            unavailableReason = null;
            org.slf4j.LoggerFactory.getLogger(LocalEmbeddingService.class)
                    .info("[Semantic] LocalEmbeddingService ready. Model: {}, Dimension: {}",
                            config.getModelId(), config.getEmbeddingDimension());

        } catch (Exception e) {
            available = false;
            unavailableReason = "Model initialization failed: " + e.getMessage();
            org.slf4j.LoggerFactory.getLogger(LocalEmbeddingService.class)
                    .error("[Semantic] Failed to initialize embedding model — semantic features disabled. Cause: {}",
                            e.getMessage());
        }
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (ortSession != null) ortSession.close();
            if (ortEnv != null) ortEnv.close();
            if (tokenizer != null) tokenizer.close();
        } catch (Exception e) {
            // best effort cleanup
        }
    }

    /**
     * Returns true if the embedding model loaded successfully and is ready for inference.
     * If false, semantic search features will be disabled; lexical search is unaffected.
     */
    public boolean isAvailable() {
        return available;
    }

    public String getUnavailableReason() {
        return unavailableReason;
    }

    public String getModelId() {
        return config.getModelId();
    }

    public int getEmbeddingDimension() {
        return config.getEmbeddingDimension();
    }

    /**
     * Embed a document passage. Prepends "passage: " prefix as required by multilingual-e5 model.
     * PRIVACY: text is not logged.
     *
     * @param text Plain text content (not null, not empty)
     * @return float[] embedding vector of length 384
     * @throws IllegalStateException if model is unavailable
     */
    public float[] embedPassage(String text) {
        return embed("passage: " + text);
    }

    /**
     * Embed a search query. Prepends "query: " prefix as required by multilingual-e5 model.
     * PRIVACY: query text is not logged.
     *
     * @param query Query string
     * @return float[] embedding vector of length 384
     * @throws IllegalStateException if model is unavailable
     */
    public float[] embedQuery(String query) {
        return embed("query: " + query);
    }

    private synchronized float[] embed(String text) {
        if (!available) {
            throw new IllegalStateException("Embedding model is not available: " + unavailableReason);
        }

        try {
            // Tokenize (truncate to max 512 tokens)
            Encoding encoding = tokenizer.encode(text);
            long[] inputIds = encoding.getIds();
            long[] attentionMask = encoding.getAttentionMask();
            long[] tokenTypeIds = encoding.getTypeIds();

            // Truncate to MAX_TOKENS if needed
            if (inputIds.length > MAX_TOKENS) {
                inputIds = java.util.Arrays.copyOf(inputIds, MAX_TOKENS);
                attentionMask = java.util.Arrays.copyOf(attentionMask, MAX_TOKENS);
                tokenTypeIds = java.util.Arrays.copyOf(tokenTypeIds, MAX_TOKENS);
            }

            int seqLen = inputIds.length;
            long[] shape = {1L, seqLen};

            OnnxTensor inputIdsTensor = OnnxTensor.createTensor(ortEnv, LongBuffer.wrap(inputIds), shape);
            OnnxTensor attentionMaskTensor = OnnxTensor.createTensor(ortEnv, LongBuffer.wrap(attentionMask), shape);
            OnnxTensor tokenTypeIdsTensor = OnnxTensor.createTensor(ortEnv, LongBuffer.wrap(tokenTypeIds), shape);

            Map<String, OnnxTensor> inputs = new HashMap<>();
            inputs.put("input_ids", inputIdsTensor);
            inputs.put("attention_mask", attentionMaskTensor);
            inputs.put("token_type_ids", tokenTypeIdsTensor);

            try (OrtSession.Result result = ortSession.run(inputs)) {
                // Output: token_embeddings [1, seqLen, 384]
                float[][][] tokenEmbeddings = (float[][][]) result.get(0).getValue();

                // Mean pooling with attention mask
                float[] pooled = meanPool(tokenEmbeddings[0], attentionMask, seqLen);

                // L2 normalize
                return l2Normalize(pooled);
            } finally {
                inputIdsTensor.close();
                attentionMaskTensor.close();
                tokenTypeIdsTensor.close();
            }

        } catch (Exception e) {
            throw new RuntimeException("Embedding inference failed: " + e.getMessage(), e);
        }
    }

    /**
     * Mean pooling: average token embeddings weighted by attention mask.
     */
    private float[] meanPool(float[][] tokenEmbeddings, long[] attentionMask, int seqLen) {
        int dim = tokenEmbeddings[0].length;
        float[] pooled = new float[dim];
        long maskSum = 0;

        for (int i = 0; i < seqLen; i++) {
            if (attentionMask[i] == 1) {
                maskSum++;
                for (int j = 0; j < dim; j++) {
                    pooled[j] += tokenEmbeddings[i][j];
                }
            }
        }

        if (maskSum > 0) {
            for (int j = 0; j < dim; j++) {
                pooled[j] /= maskSum;
            }
        }
        return pooled;
    }

    /**
     * L2 normalize embedding vector.
     */
    private float[] l2Normalize(float[] v) {
        double norm = 0.0;
        for (float x : v) norm += (double) x * x;
        norm = Math.sqrt(norm);
        if (norm < 1e-9) return v;
        float[] normalized = new float[v.length];
        for (int i = 0; i < v.length; i++) {
            normalized[i] = (float) (v[i] / norm);
        }
        return normalized;
    }

    /**
     * Cosine similarity between two L2-normalized vectors.
     * Since both are normalized, this is simply the dot product.
     * Result is in [-1, 1]; higher = more similar.
     */
    public static double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) return 0.0;
        double dot = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
        }
        return dot;
    }

    /**
     * Serialize float[] to little-endian byte[].
     */
    public static byte[] floatArrayToBytes(float[] floats) {
        java.nio.ByteBuffer buf = java.nio.ByteBuffer.allocate(floats.length * 4)
                .order(java.nio.ByteOrder.LITTLE_ENDIAN);
        for (float f : floats) buf.putFloat(f);
        return buf.array();
    }

    /**
     * Deserialize little-endian byte[] to float[].
     */
    public static float[] bytesToFloatArray(byte[] bytes) {
        java.nio.ByteBuffer buf = java.nio.ByteBuffer.wrap(bytes)
                .order(java.nio.ByteOrder.LITTLE_ENDIAN);
        float[] floats = new float[bytes.length / 4];
        for (int i = 0; i < floats.length; i++) floats[i] = buf.getFloat();
        return floats;
    }
}
