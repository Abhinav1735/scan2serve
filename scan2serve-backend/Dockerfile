# ==========================================
# BUILD STAGE
# ==========================================

FROM eclipse-temurin:21-jdk AS builder

WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./

RUN chmod +x mvnw

RUN ./mvnw dependency:go-offline -DskipTests

COPY src src

RUN ./mvnw clean package -DskipTests


# ==========================================
# RUNTIME STAGE
# ==========================================

FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
    "-XX:+UseSerialGC", \
    "-XX:MaxRAMPercentage=70", \
    "-XX:InitialRAMPercentage=20", \
    "-Djava.security.egd=file:/dev/./urandom", \
    "-jar", \
    "app.jar"]