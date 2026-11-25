"""Genera dos modelos Keras con datos ficticios y reporta métricas de prueba."""

import json
from pathlib import Path

import numpy as np
import tensorflow as tf
from tensorflow import keras

CARPETA_MODELOS = Path(__file__).resolve().parent / "modelos"
VERSION = "demo-2026-v1"
TIPOS = ("licencia", "obra", "servicio")
LIMITES_TRAMITE = (30, 5, 3)


def entrada_tramite(codigos, pendientes, anexos, derivaciones):
    tipos = np.asarray([TIPOS.index(codigo) for codigo in codigos])
    return np.column_stack((np.eye(len(TIPOS))[tipos], pendientes, anexos, derivaciones)).astype(
        "float32"
    )


def entrada_cv(total, faltantes, ilegibles):
    return np.column_stack((np.asarray(faltantes) / total, np.asarray(ilegibles) / total)).astype(
        "float32"
    )


def entrenar_modelo(x, y, clasificacion=False):
    normalizacion = keras.layers.Normalization()
    normalizacion.adapt(x[:420])
    activacion = "sigmoid" if clasificacion else "linear"
    perdida = "binary_crossentropy" if clasificacion else "mse"
    modelo = keras.Sequential([
        keras.Input(shape=(x.shape[1],)),
        normalizacion,
        keras.layers.Dense(1, activation=activacion),
    ])
    modelo.compile(optimizer=keras.optimizers.Adam(0.02), loss=perdida)

    def lotes(entradas, salidas):
        opciones = tf.data.Options()
        opciones.threading.private_threadpool_size = 1
        datos = tf.data.Dataset.from_tensor_slices((entradas, salidas.reshape(-1, 1)))
        return datos.batch(32).with_options(opciones)

    modelo.fit(
        lotes(x[:420], y[:420]),
        validation_data=lotes(x[420:510], y[420:510]),
        epochs=140,
        shuffle=False,
        callbacks=[keras.callbacks.EarlyStopping(patience=15, restore_best_weights=True)],
        verbose=0,
    )
    return modelo


def metricas_alerta(real, estimado):
    aciertos = int(np.count_nonzero(real & estimado))
    alertas = int(np.count_nonzero(estimado))
    positivos = int(np.count_nonzero(real))
    return {
        "precision": round(aciertos / alertas, 4) if alertas else None,
        "recall": round(aciertos / positivos, 4) if positivos else None,
        "positivos_prueba": positivos,
    }