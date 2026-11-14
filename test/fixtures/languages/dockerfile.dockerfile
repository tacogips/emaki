# comment
FROM alpine
RUN printf "hello" && \
    echo continued
COPY a b
ENV N=42
WORKDIR /app
ARG COUNT=3
ENV MODE=prod
COPY src dest
RUN printf "done"
EXPOSE 80
LABEL name="sample"
CMD echo done
FROM scratch
COPY x y
WORKDIR /app
ARG COUNT=3
ENV MODE=prod
COPY src dest
