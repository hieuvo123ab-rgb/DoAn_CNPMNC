package com.edms.service;

import jakarta.annotation.PostConstruct;
import org.bouncycastle.asn1.x500.X500Name;
import org.bouncycastle.cert.X509v3CertificateBuilder;
import org.bouncycastle.cert.jcajce.JcaX509CertificateConverter;
import org.bouncycastle.cert.jcajce.JcaX509v3CertificateBuilder;
import org.bouncycastle.operator.ContentSigner;
import org.bouncycastle.operator.jcajce.JcaContentSignerBuilder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.math.BigInteger;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.*;
import java.security.cert.X509Certificate;
import java.util.Date;

/**
 * Phase 13: KeyStore lifecycle management.
 *
 * On first startup, generates a self-signed RSA-2048 X.509 v3 certificate
 * using BouncyCastle and persists it as a PKCS12 keystore at the configured path.
 * On subsequent startups, loads the existing keystore.
 *
 * The private key NEVER leaves this service — it is only used internally by SignatureService.
 */
@Service
public class KeyStoreService {

    @Value("${edms.keystore.path:/app/keys/edms-signing.p12}")
    private String keystorePath;

    @Value("${edms.keystore.password}")
    private String keystorePassword;

    @Value("${edms.keystore.legacy-password:}")
    private String legacyPassword;

    @Value("${edms.keystore.alias:edms-signing}")
    private String keystoreAlias;

    private KeyStore keyStore;
    private PrivateKey privateKey;
    private X509Certificate signingCertificate;

    @PostConstruct
    public void initialize() throws Exception {
        File ksFile = new File(keystorePath);
        if (ksFile.exists()) {
            loadExistingKeyStore(ksFile);
        } else {
            generateAndPersistKeyStore(ksFile);
        }
    }

    private void loadExistingKeyStore(File ksFile) throws Exception {
        keyStore = KeyStore.getInstance("PKCS12");
        char[] activePass = keystorePassword.toCharArray();
        boolean loaded = false;
        try (FileInputStream fis = new FileInputStream(ksFile)) {
            keyStore.load(fis, activePass);
            loaded = true;
        } catch (Exception e) {
            if (legacyPassword != null && !legacyPassword.isBlank()) {
                try (FileInputStream fis = new FileInputStream(ksFile)) {
                    keyStore.load(fis, legacyPassword.toCharArray());
                    activePass = legacyPassword.toCharArray();
                    loaded = true;
                } catch (Exception ignored) {
                }
            }
            if (!loaded) {
                throw e;
            }
        }
        privateKey = (PrivateKey) keyStore.getKey(keystoreAlias, activePass);
        signingCertificate = (X509Certificate) keyStore.getCertificate(keystoreAlias);

        if (privateKey == null || signingCertificate == null) {
            throw new IllegalStateException(
                "[Phase 13] KeyStore loaded but alias '" + keystoreAlias + "' is missing key/cert. " +
                "Delete " + keystorePath + " and restart to regenerate.");
        }
    }

    private void generateAndPersistKeyStore(File ksFile) throws Exception {
        // Ensure parent directories exist
        Files.createDirectories(Paths.get(ksFile.getParent()));

        // Generate RSA-2048 key pair
        KeyPairGenerator kpg = KeyPairGenerator.getInstance("RSA");
        kpg.initialize(2048, new SecureRandom());
        KeyPair keyPair = kpg.generateKeyPair();

        // Build X.509 v3 Self-Signed Certificate (10 years validity) using BouncyCastle
        X500Name issuer = new X500Name("CN=EDMS Signing CA, O=EDMS, OU=Document Integrity, C=VN");
        BigInteger serial = BigInteger.valueOf(System.currentTimeMillis());
        Date notBefore = new Date();
        Date notAfter = new Date(System.currentTimeMillis() + 10L * 365 * 24 * 60 * 60 * 1000);

        X509v3CertificateBuilder certBuilder = new JcaX509v3CertificateBuilder(
                issuer, serial, notBefore, notAfter, issuer, keyPair.getPublic());

        ContentSigner signer = new JcaContentSignerBuilder("SHA256withRSA")
                .build(keyPair.getPrivate());

        signingCertificate = new JcaX509CertificateConverter()
                .getCertificate(certBuilder.build(signer));

        privateKey = keyPair.getPrivate();

        // Persist to PKCS12 KeyStore
        keyStore = KeyStore.getInstance("PKCS12");
        keyStore.load(null, null); // initialize empty
        keyStore.setKeyEntry(
                keystoreAlias,
                privateKey,
                keystorePassword.toCharArray(),
                new java.security.cert.Certificate[]{signingCertificate});

        try (FileOutputStream fos = new FileOutputStream(ksFile)) {
            keyStore.store(fos, keystorePassword.toCharArray());
        }

        // Restrict keystore file permissions: readable and writable by owner process only
        try {
            ksFile.setReadable(false, false);
            ksFile.setReadable(true, true);
            ksFile.setWritable(false, false);
            ksFile.setWritable(true, true);
        } catch (Exception ignored) {
            // Best effort on platforms that do not support POSIX file permission bits
        }

        System.out.println("[Phase 13] Generated new RSA-2048 signing KeyStore at: " + keystorePath
                + " | Serial: " + serial + " | Valid until: " + notAfter);
    }

    /**
     * Returns the RSA private key for signing. NEVER expose this via REST.
     */
    public PrivateKey getSigningKey() {
        return privateKey;
    }

    /**
     * Returns the X.509 signing certificate (public key + metadata only).
     */
    public X509Certificate getSigningCertificate() {
        return signingCertificate;
    }

    /**
     * Returns the configured alias name.
     */
    public String getKeystoreAlias() {
        return keystoreAlias;
    }
}
