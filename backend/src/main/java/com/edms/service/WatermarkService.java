package com.edms.service;

import com.edms.entity.Document;
import com.edms.entity.DocumentVersion;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.graphics.image.LosslessFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.pdmodel.graphics.state.PDExtendedGraphicsState;
import org.apache.pdfbox.util.Matrix;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;

/**
 * Phase 14: Dynamic Watermarking & QR Code Verification Overlay Service.
 *
 * CRITICAL ZERO-TAMPER GUARANTEE:
 * Watermarking is an on-the-fly streaming transformation.
 * The underlying physical stored file bytes, database record, and SHA-256 hash
 * are NEVER modified.
 */
@Service
public class WatermarkService {

    private static final Logger log = LoggerFactory.getLogger(WatermarkService.class);
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter
            .ofPattern("yyyy-MM-dd HH:mm:ss")
            .withZone(ZoneId.systemDefault());

    /**
     * Generate QR Code as BufferedImage using ZXing.
     */
    public BufferedImage generateQrCodeImage(String content, int width, int height) throws Exception {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        Map<EncodeHintType, Object> hints = new HashMap<>();
        hints.put(EncodeHintType.CHARACTER_SET, "UTF-8");
        hints.put(EncodeHintType.MARGIN, 1);
        BitMatrix bitMatrix = qrCodeWriter.encode(content, BarcodeFormat.QR_CODE, width, height, hints);
        return MatrixToImageWriter.toBufferedImage(bitMatrix);
    }

    /**
     * Build the public verification URL for QR code encoding.
     */
    public String buildVerificationUrl(Long docId, Integer versionNumber, String fileHash, String baseUrl) {
        String base = (baseUrl != null && !baseUrl.isBlank()) ? baseUrl : "http://localhost:5173";
        return String.format("%s/verify?docId=%d&version=%d&hash=%s", base, docId, versionNumber, fileHash != null ? fileHash : "");
    }

    /**
     * Check if a file is a PDF based on content-type or filename.
     */
    public boolean isPdf(String contentType, String fileName) {
        if (contentType != null && contentType.equalsIgnoreCase("application/pdf")) {
            return true;
        }
        return fileName != null && fileName.toLowerCase().endsWith(".pdf");
    }

    /**
     * Check if a file is an image based on content-type or filename.
     */
    public boolean isImage(String contentType, String fileName) {
        if (contentType != null && contentType.startsWith("image/")) {
            return true;
        }
        if (fileName != null) {
            String lower = fileName.toLowerCase();
            return lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg");
        }
        return false;
    }

    /**
     * Apply Dynamic Watermark and QR Code Overlay to a PDF file on-the-fly.
     * Does NOT alter physical source file.
     */
    public byte[] applyWatermarkAndQrToPdf(byte[] originalPdfBytes,
                                           Document document,
                                           DocumentVersion version,
                                           String requestingUser,
                                           String customWatermarkText,
                                           boolean includeQr,
                                           String verificationBaseUrl) throws Exception {
        try (PDDocument pdDoc = PDDocument.load(originalPdfBytes)) {
            if (pdDoc.isEncrypted()) {
                log.warn("Cannot watermark encrypted PDF for document ID {}", document.getId());
                return originalPdfBytes;
            }

            int pageCount = pdDoc.getNumberOfPages();
            if (pageCount == 0) {
                return originalPdfBytes;
            }

            // Prepare watermark text
            String userTag = (requestingUser != null && !requestingUser.isBlank()) ? requestingUser : "ANONYMOUS";
            String nowStr = DATE_FORMATTER.format(java.time.Instant.now());
            String watermark = (customWatermarkText != null && !customWatermarkText.isBlank())
                    ? toAscii(customWatermarkText)
                    : "EDMS - " + toAscii(userTag).toUpperCase() + " - " + nowStr;

            String hashTag = version.getFileHash() != null ? version.getFileHash() : "UNHASHED";
            String shortHash = hashTag.length() > 20 ? hashTag.substring(0, 20) + "..." : hashTag;
            String verificationUrl = buildVerificationUrl(document.getId(), version.getVersionNumber(), version.getFileHash(), verificationBaseUrl);

            // Generate QR Code if requested
            PDImageXObject pdQrImage = null;
            if (includeQr) {
                BufferedImage qrImg = generateQrCodeImage(verificationUrl, 160, 160);
                pdQrImage = LosslessFactory.createFromImage(pdDoc, qrImg);
            }

            PDFont fontBold = PDType1Font.HELVETICA_BOLD;
            PDFont fontRegular = PDType1Font.HELVETICA;

            for (int i = 0; i < pageCount; i++) {
                PDPage page = pdDoc.getPage(i);
                PDRectangle mediaBox = page.getMediaBox();
                float width = mediaBox.getWidth();
                float height = mediaBox.getHeight();

                try (PDPageContentStream cs = new PDPageContentStream(pdDoc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {

                    // 1. Diagonal Center Watermark (Semi-transparent)
                    PDExtendedGraphicsState gsWatermark = new PDExtendedGraphicsState();
                    gsWatermark.setNonStrokingAlphaConstant(0.20f);
                    gsWatermark.setStrokingAlphaConstant(0.20f);
                    cs.setGraphicsStateParameters(gsWatermark);

                    float fontSize = 36f;
                    float textWidth = fontBold.getStringWidth(watermark) / 1000 * fontSize;
                    float centerX = width / 2;
                    float centerY = height / 2;

                    cs.setNonStrokingColor(150, 150, 150);
                    cs.beginText();
                    cs.setFont(fontBold, fontSize);
                    // Center and rotate 45 degrees
                    Matrix matrix = Matrix.getRotateInstance(Math.toRadians(45), centerX, centerY);
                    matrix.translate(-textWidth / 2, 0);
                    cs.setTextMatrix(matrix);
                    cs.showText(watermark);
                    cs.endText();

                    // 2. Header Security Banner (Top)
                    PDExtendedGraphicsState gsBanner = new PDExtendedGraphicsState();
                    gsBanner.setNonStrokingAlphaConstant(0.70f);
                    cs.setGraphicsStateParameters(gsBanner);

                    cs.setNonStrokingColor(80, 80, 80);
                    cs.beginText();
                    cs.setFont(fontRegular, 8f);
                    cs.newLineAtOffset(30, height - 18);
                    String headerText = String.format("EDMS SECURED | DOC #%d (v%d) | %s | %s",
                            document.getId(), version.getVersionNumber(), toAscii(document.getTitle()), toAscii(document.getDocumentType()));
                    cs.showText(headerText);
                    cs.endText();

                    // 3. Footer Audit Banner (Bottom)
                    cs.beginText();
                    cs.setFont(fontRegular, 7.5f);
                    cs.newLineAtOffset(30, 14);
                    String footerText = String.format("Exported by: %s | Time: %s | SHA-256: %s",
                            toAscii(userTag), nowStr, shortHash);
                    cs.showText(footerText);
                    cs.endText();

                    // 4. Page 1 QR Verification Stamp (Bottom-Right)
                    if (i == 0 && pdQrImage != null) {
                        PDExtendedGraphicsState gsQr = new PDExtendedGraphicsState();
                        gsQr.setNonStrokingAlphaConstant(0.92f);
                        cs.setGraphicsStateParameters(gsQr);

                        float qrSize = 65f;
                        float qrX = width - qrSize - 30;
                        float qrY = 32f; // Bottom right, above footer

                        // Draw background box for QR code
                        cs.setNonStrokingColor(255, 255, 255);
                        cs.addRect(qrX - 4, qrY - 14, qrSize + 8, qrSize + 22);
                        cs.fill();

                        // Border for stamp box
                        cs.setStrokingColor(180, 180, 180);
                        cs.setLineWidth(0.6f);
                        cs.addRect(qrX - 4, qrY - 14, qrSize + 8, qrSize + 22);
                        cs.stroke();

                        // Draw QR Image
                        cs.drawImage(pdQrImage, qrX, qrY, qrSize, qrSize);

                        // Label below QR
                        cs.setNonStrokingColor(40, 40, 40);
                        cs.beginText();
                        cs.setFont(fontBold, 6f);
                        cs.newLineAtOffset(qrX - 2, qrY - 9);
                        cs.showText("SCAN TO VERIFY INTEGRITY");
                        cs.endText();
                    }
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            pdDoc.save(baos);
            return baos.toByteArray();
        }
    }

    /**
     * Apply Dynamic Watermark and QR Code Overlay to Image files (PNG, JPEG).
     */
    public byte[] applyWatermarkAndQrToImage(byte[] originalImageBytes,
                                             Document document,
                                             DocumentVersion version,
                                             String requestingUser,
                                             String customWatermarkText,
                                             boolean includeQr,
                                             String verificationBaseUrl) throws Exception {
        BufferedImage originalImage = ImageIO.read(new ByteArrayInputStream(originalImageBytes));
        if (originalImage == null) {
            return originalImageBytes;
        }

        int width = originalImage.getWidth();
        int height = originalImage.getHeight();
        if (width < 50 || height < 50) {
            return originalImageBytes;
        }

        BufferedImage watermarked = new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g2d = watermarked.createGraphics();

        // High quality rendering hints
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Draw original image
        g2d.drawImage(originalImage, 0, 0, null);

        // Watermark text
        String userTag = (requestingUser != null && !requestingUser.isBlank()) ? requestingUser : "ANONYMOUS";
        String nowStr = DATE_FORMATTER.format(java.time.Instant.now());
        String watermark = (customWatermarkText != null && !customWatermarkText.isBlank())
                ? customWatermarkText
                : "EDMS - " + userTag.toUpperCase() + " - " + nowStr;

        // Diagonal watermark in center
        g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.22f));
        g2d.setColor(Color.LIGHT_GRAY);
        Font font = new Font(Font.SANS_SERIF, Font.BOLD, Math.max(24, width / 25));
        g2d.setFont(font);

        FontMetrics fm = g2d.getFontMetrics();
        int textW = fm.stringWidth(watermark);

        g2d.translate(width / 2, height / 2);
        g2d.rotate(Math.toRadians(-35));
        g2d.drawString(watermark, -textW / 2, 0);
        g2d.rotate(Math.toRadians(35));
        g2d.translate(-width / 2, -height / 2);

        // Bottom Banner if space allows
        if (width >= 200 && height >= 100) {
            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.75f));
            g2d.setColor(new Color(240, 240, 240, 210));
            g2d.fillRect(0, height - 35, width, 35);
            g2d.setColor(Color.DARK_GRAY);
            g2d.setFont(new Font(Font.SANS_SERIF, Font.PLAIN, Math.max(11, width / 60)));
            g2d.drawString("EDMS SECURED | DOC #" + document.getId() + " v" + version.getVersionNumber() + " | Exported by: " + userTag + " | " + nowStr, 15, height - 12);
        }

        // QR Code in bottom-right corner if requested and space allows
        if (includeQr && width >= 250 && height >= 250) {
            String verificationUrl = buildVerificationUrl(document.getId(), version.getVersionNumber(), version.getFileHash(), verificationBaseUrl);
            int qrSize = Math.max(70, width / 12);
            BufferedImage qrImg = generateQrCodeImage(verificationUrl, qrSize, qrSize);

            int qrX = width - qrSize - 15;
            int qrY = height - qrSize - 45;

            g2d.setComposite(AlphaComposite.getInstance(AlphaComposite.SRC_OVER, 0.95f));
            g2d.setColor(Color.WHITE);
            g2d.fillRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6);
            g2d.setColor(Color.GRAY);
            g2d.drawRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 6);
            g2d.drawImage(qrImg, qrX, qrY, null);
        }

        g2d.dispose();

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(watermarked, "png", baos);
        return baos.toByteArray();
    }

    private String toAscii(String input) {
        if (input == null) return "";
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD);
        String ascii = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        ascii = ascii.replace("đ", "d").replace("Đ", "D");
        return ascii.replaceAll("[^\\x20-\\x7E]", " ").trim();
    }
}
