.PHONY: all build test lint deploy frontend-dev

all: build test

build:
	stellar contract build --manifest-path contracts/splitstar/Cargo.toml --profile release

test:
	cargo test --all --features testutils

lint:
	cargo clippy --all --all-targets -- -D warnings && cargo fmt --all -- --check

deploy:
	chmod +x scripts/deploy.sh && ./scripts/deploy.sh

frontend-dev:
	cd frontend && npm install && npm run dev

ci: lint test build
