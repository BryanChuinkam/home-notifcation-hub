FROM node:22.23.2-bookworm
ARG RUNNER_VERSION=2.338.1
ARG RUNNER_SHA256=475e0c149fd3b611610127b9664ba5bacf5c6928795cc448ab520bb5f324bede
RUN apt-get update && apt-get install -y --no-install-recommends sudo libicu72 ca-certificates curl git unzip \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --create-home --uid 1001 runner \
    && echo 'runner ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/runner \
    && chmod 0440 /etc/sudoers.d/runner
WORKDIR /runner
RUN curl --fail --location --silent --show-error "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/actions-runner-linux-arm64-${RUNNER_VERSION}.tar.gz" -o /tmp/runner.tar.gz \
    && echo "${RUNNER_SHA256}  /tmp/runner.tar.gz" | sha256sum --check \
    && tar -xzf /tmp/runner.tar.gz && rm /tmp/runner.tar.gz \
    && chown -R runner:runner /runner
USER runner
# Credentials and work live only in this disposable container. Registration is
# supplied over docker exec stdin, never an image layer or container environment.
CMD ["bash", "-c", "until [ -f /runner/.configured ]; do sleep 1; done; exec ./run.sh"]
