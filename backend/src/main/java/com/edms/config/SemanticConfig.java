package com.edms.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Phase 12: Centralized semantic search configuration.
 * All tuneable parameters are in application.properties — no magic scattered constants.
 */
@Component
public class SemanticConfig {

    /** Characters per chunk (approx, split on whitespace). Default: 1000 */
    @Value("${edms.semantic.chunk-size:1000}")
    private int chunkSize;

    /** Overlap characters between adjacent chunks. Default: 150 */
    @Value("${edms.semantic.chunk-overlap:150}")
    private int chunkOverlap;

    /** Minimum cosine similarity score to include in results. Default: 0.30 */
    @Value("${edms.semantic.min-score:0.30}")
    private double minScore;

    /** Default topK for semantic search. Default: 20 */
    @Value("${edms.semantic.top-k-default:20}")
    private int topKDefault;

    /** Maximum topK allowed. Requests above this return 400. Default: 50 */
    @Value("${edms.semantic.top-k-max:50}")
    private int topKMax;

    /** Lexical weight in hybrid scoring. Must sum with semanticWeight to 1.0. Default: 0.45 */
    @Value("${edms.semantic.hybrid-lexical-weight:0.45}")
    private double hybridLexicalWeight;

    /** Semantic weight in hybrid scoring. Must sum with lexicalWeight to 1.0. Default: 0.55 */
    @Value("${edms.semantic.hybrid-semantic-weight:0.55}")
    private double hybridSemanticWeight;

    /**
     * Stable model identifier stored alongside embeddings.
     * If this value changes, old embeddings with different model ID will not be mixed.
     * Default: multilingual-e5-small-onnx-int8-v1
     */
    @Value("${edms.semantic.model-id:multilingual-e5-small-onnx-int8-v1}")
    private String modelId;

    /** Path to local ONNX model directory (mounted in Docker container). */
    @Value("${edms.semantic.model-path:/app/models/multilingual-e5-small-onnx-int8}")
    private String modelPath;

    /** Maximum query length in characters. Default: 1000 */
    @Value("${edms.semantic.max-query-chars:1000}")
    private int maxQueryChars;

    /** Minimum meaningful query length. Default: 2 */
    @Value("${edms.semantic.min-query-chars:2}")
    private int minQueryChars;

    /** Embedding vector dimension (must match model). Default: 384 */
    @Value("${edms.semantic.embedding-dimension:384}")
    private int embeddingDimension;

    /** Minimum extracted text chars to qualify as "meaningful" for embedding. Default: 50 */
    @Value("${edms.semantic.min-text-chars:50}")
    private int minTextChars;

    // Getters
    public int getChunkSize() { return chunkSize; }
    public int getChunkOverlap() { return chunkOverlap; }
    public double getMinScore() { return minScore; }
    public int getTopKDefault() { return topKDefault; }
    public int getTopKMax() { return topKMax; }
    public double getHybridLexicalWeight() { return hybridLexicalWeight; }
    public double getHybridSemanticWeight() { return hybridSemanticWeight; }
    public String getModelId() { return modelId; }
    public String getModelPath() { return modelPath; }
    public int getMaxQueryChars() { return maxQueryChars; }
    public int getMinQueryChars() { return minQueryChars; }
    public int getEmbeddingDimension() { return embeddingDimension; }
    public int getMinTextChars() { return minTextChars; }
}
