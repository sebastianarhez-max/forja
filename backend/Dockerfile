FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q dependency:go-offline
COPY src ./src
RUN mvn -q package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/forja-api.jar app.jar
EXPOSE 8080
# Zona horaria de Lima y memoria acotada para el plan gratuito de Render
ENTRYPOINT ["java", "-Duser.timezone=America/Lima", "-XX:MaxRAMPercentage=75", "-jar", "app.jar"]
