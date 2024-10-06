FROM serversideup/php:8.3-unit as base

USER root

LABEL authors="Kirschbaum"
LABEL maintainer="Kirschbaum"

ENV AUTORUN_ENABLED=true

RUN apt-get update \
    && apt-get upgrade -y

RUN install-php-extensions gd intl

ENV NVM_VERSION v0.39.7
ENV NODE_VERSION 21.6.0
ENV NVM_DIR /usr/local/nvm
RUN mkdir "$NVM_DIR"

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

ENV NODE_PATH $NVM_DIR/v$NODE_VERSION/lib/node_modules
ENV PATH $NVM_DIR/versions/node/v$NODE_VERSION/bin:$PATH

RUN echo "source $NVM_DIR/nvm.sh \
    && nvm install $NODE_VERSION \
    && nvm alias default $NODE_VERSION \
    && nvm use default \
    && nvm install-latest-npm" | bash

# COPY .infrastructure/docker/s6-overlay/scripts /etc/s6-overlay/scripts/
# COPY .infrastructure/docker/s6-overlay/s6-rc.d /etc/s6-overlay/s6-rc.d/
# COPY .infrastructure/docker/s6-overlay/user/ /etc/s6-overlay/s6-rc.d/user/contents.d/

# RUN chmod -R 755 /etc/s6-overlay/

# EXPOSE 80

FROM base as development

# Save the build arguments as a variable
ARG USER_ID
ARG GROUP_ID

# Drop back to our unprivileged user
USER www-data

FROM base as deploy

COPY --chown=www-data:www-data . /var/www/html

# Drop back to our unprivileged user
USER www-data

# Set the entrypoint to s6-overlay's init process
# ENTRYPOINT ["/init"]
