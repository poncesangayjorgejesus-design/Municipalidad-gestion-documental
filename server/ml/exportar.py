"""Exporta la normalización y la capa densa de cada modelo Keras para Node.js."""

import json
from pathlib import Path

import numpy as np
from tensorflow import keras

from entrenar import TIPOS, VERSION

MODELOS = Path(__file__).parent / "modelos"


def exportar(archivo):
    modelo = keras.models.load_model(MODELOS / archivo)
    normalizacion, densa = modelo.layers
    pesos, sesgo = densa.get_weights()
    escala = np.maximum(np.sqrt(normalizacion.variance.numpy()), keras.backend.epsilon())
    return {
        "media": normalizacion.mean.numpy().flatten().tolist(),
        "escala": escala.flatten().tolist(),
        "pesos": pesos.flatten().tolist(),
        "sesgo": float(sesgo[0]),
        "activacion": densa.activation.__name__,
    }
