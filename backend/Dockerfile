# Stage 1: Build application with Maven and Java 21
# Using Ubuntu-based image (glibc) for ONNX Runtime compatibility
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
# Download dependencies
RUN mvn dependency:go-offline -B || true
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Runtime image with Java 21 (Ubuntu Jammy for glibc - required by ONNX Runtime)
# NOTE: Alpine musl libc is NOT compatible with ONNX Runtime prebuilt binaries
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

# Install Tesseract OCR (apt-get for Ubuntu/Debian)
RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    tesseract-ocr-eng \
    tesseract-ocr-vie \
    && rm -rf /var/lib/apt/lists/*

# Create storage and keys directories and non-root user edms (UID 10001)
RUN groupadd -g 10001 edms && \
    useradd -u 10001 -g edms -d /app -s /bin/sh edms && \
    mkdir -p /app/storage/uploads /app/keys && \
    chown -R edms:edms /app

# Copy application JAR
COPY --from=builder --chown=edms:edms /app/target/edms-backend-*.jar app.jar

# Copy Phase 12 local embedding model (ONNX int8 quantized, ~113MB)
# Model: Xenova/multilingual-e5-small (intfloat/multilingual-e5-small), MIT License
# Embedding dim: 384, Languages: 100 (incl. Vietnamese + English)
COPY --chown=edms:edms models/multilingual-e5-small-onnx-int8/ /app/models/multilingual-e5-small-onnx-int8/

# Switch to non-root runtime user
USER edms:edms

EXPOSE 8080
ENV SPRING_PROFILES_ACTIVE=prod
ENTRYPOINT ["java", "-jar", "app.jar"]
