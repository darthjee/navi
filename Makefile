.PHONY: help setup dev tests build-dev build build-httpd build-image release update-description dev-app-up

PROJECT ?= navi
COMPOSE ?= docker compose
APP_SERVICE ?= $(PROJECT)_app
DEV_SERVICE ?= $(PROJECT)_dev_app
TEST_SERVICE ?= $(PROJECT)_tests
DEV_SHELL ?= /bin/bash
IMAGE ?= $(PROJECT)
APP_IMAGE ?= $(PROJECT)_app
DOCKERFILE_DEV ?= dockerfiles/dev_navi_hey/Dockerfile
DOCKERFILE_DEV_APP ?= dockerfiles/dev_app/Dockerfile
DOCKERFILE_PROD ?= dockerfiles/production_navi_hey/Dockerfile
PROD_IMAGE := darthjee/navi-hey
PLATFORM := linux/amd64
DOCKER_HUB_SCRIPT ?= /home/scripts/sbin/docker_hub.sh

SOURCE_FILES=source/bin/navi.js source/lib/**/*.js
MD_FILES=AGENTS.md docs/agents/*.md

help:
	@echo "Usage:"
	@echo "  make setup      Prepare dev environment (.env + compose build)"
	@echo "  make dev        Open $(APP_SERVICE) container with $(DEV_SHELL)"
	@echo "  make tests      Open $(TEST_SERVICE) container with $(DEV_SHELL)"
	@echo "  make dev-app    Build development image from $(DOCKERFILE_DEV)"
	@echo "  make build-dev  Build dev app image from $(DOCKERFILE_DEV)"
	@echo "  make build-dev-app Build dev app image from $(DOCKERFILE_DEV)"

setup: .env docker_volumes/config/navi_config.yml
	$(COMPOSE) build base_build
	$(COMPOSE) run --rm $(APP_SERVICE) yarn install

dev: .env
	@$(COMPOSE) ps -q --status running navi_web_proxy | grep -q . || $(COMPOSE) up -d navi_web_proxy
	$(COMPOSE) exec $(APP_SERVICE) $(DEV_SHELL)

tests:
	$(COMPOSE) run --rm $(TEST_SERVICE) $(DEV_SHELL)

dev-app:
	$(COMPOSE) run --rm $(DEV_SERVICE) $(DEV_SHELL)

dev-app-up:
	$(COMPOSE) up navi_dev_app navi_proxy

build-dev:
	docker build -f $(DOCKERFILE_DEV) . -t $(IMAGE):dev

build-dev-app:
	docker build -f $(DOCKERFILE_DEV_APP) . -t $(APP_IMAGE):dev

build:
	docker build -f $(DOCKERFILE_PROD) . -t $(PROD_IMAGE):latest

build-image:
	@if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make build-image)"; exit 1; fi
	docker build --platform $(PLATFORM) -f $(DOCKERFILE_PROD) --build-arg NAVI_VERSION=$(TAG) . -t $(PROD_IMAGE):$(TAG) -t $(PROD_IMAGE):latest

release:
	@if [ -z "$(TAG)" ]; then echo "TAG not set (use TAG=<tag> make release)"; exit 1; fi
	$(MAKE) build-image TAG=$(TAG)
	@echo "$$DOCKER_HUB_PASSWORD" | docker login -u "$$DOCKER_HUB_USERNAME" --password-stdin
	docker push $(PROD_IMAGE):$(TAG)
	docker push $(PROD_IMAGE):latest

update-description:
	/bin/sh $(DOCKER_HUB_SCRIPT) login_and_push_description $(PROD_IMAGE) DOCKERHUB_DESCRIPTION.md

.env:
	cp .env.sample .env

docker_volumes/config/navi_config.yml:
	cp docker_volumes/config/navi_config.yml.sample docker_volumes/config/navi_config.yml

output/source.js: $(SOURCE_FILES)
	./scripts/export_js.sh -o output/source.js $(SOURCE_FILES) 

output/doc.md: $(MD_FILES)
	./scripts/export_md.sh -o output/doc.md $(MD_FILES) 
