"""Provider package."""
from .base import VideoProvider, VideoRequest, VideoResponse, ProviderFeatures
from .sora import SoraProvider
from .runway import RunwayProvider
from .kling import KlingProvider
from .grok import GrokProvider


# Provider registry
PROVIDERS = {
    "openai": SoraProvider,
    "runway": RunwayProvider,
    "kling": KlingProvider,
    "grok": GrokProvider,
}

# Model to provider mapping
MODEL_PROVIDER_MAP = {
    "sora-2": "openai",
    "sora-1": "openai",
    "runway-gen3": "runway",
    "runway-gen4": "runway",
    "kling-1.5": "kling",
    "kling-1.0": "kling",
    "grok-imagine-video-1.5": "grok",
}


def get_provider_for_model(model: str) -> str:
    """Get provider name for a model."""
    return MODEL_PROVIDER_MAP.get(model, "openai")


def create_provider(provider_name: str, api_key: str) -> VideoProvider:
    """Create provider instance."""
    provider_class = PROVIDERS.get(provider_name)
    if not provider_class:
        raise ValueError(f"Unknown provider: {provider_name}")
    return provider_class(api_key)


__all__ = [
    "VideoProvider",
    "VideoRequest",
    "VideoResponse",
    "ProviderFeatures",
    "SoraProvider",
    "RunwayProvider",
    "KlingProvider",
    "GrokProvider",
    "PROVIDERS",
    "MODEL_PROVIDER_MAP",
    "get_provider_for_model",
    "create_provider",
]
