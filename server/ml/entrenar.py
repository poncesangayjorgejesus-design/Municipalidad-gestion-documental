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


def entrenar_tramites(azar):
    tipo = azar.integers(0, len(TIPOS), 600)
    pendientes, anexos, derivaciones = [
        azar.integers(0, maximo + 1, 600) for maximo in LIMITES_TRAMITE
    ]
    entradas = entrada_tramite([TIPOS[i] for i in tipo], pendientes, anexos, derivaciones)
    base = np.array([3, 5, 2])[tipo]
    plazo = np.array([7, 10, 5])[tipo]
    ruido = azar.normal(0, 0.65, len(tipo))
    dias = np.maximum(base + 0.18 * pendientes + 0.70 * anexos + 1.10 * derivaciones + ruido, 0)
    dias = dias.astype("float32")
    modelo = entrenar_modelo(entradas, dias)
    esperado = dias[510:]
    predicho = np.maximum(modelo(entradas[510:], training=False).numpy().ravel(), 0)
    error = esperado - predicho
    modelo.save(CARPETA_MODELOS / "tramites.keras")
    return {
        "mae_dias": round(float(np.mean(np.abs(error))), 3),
        "mse_dias2": round(float(np.mean(error**2)), 3),
        "mae_referencia_dias": round(float(np.mean(np.abs(esperado - dias[:420].mean()))), 3),
        **metricas_alerta(esperado > plazo[510:], predicho > plazo[510:]),
    }


def entrenar_cv(azar):
    total = azar.integers(3, 9, 600)
    faltantes = azar.binomial(total, 0.12)
    ilegibles = azar.binomial(total - faltantes, 0.10)
    entradas = entrada_cv(total, faltantes, ilegibles)
    requiere_revision = ((faltantes + ilegibles) > 0).astype("float32")
    modelo = entrenar_modelo(entradas, requiere_revision, clasificacion=True)
    predicho = modelo(entradas[510:], training=False).numpy().ravel() >= 0.5
    esperado = requiere_revision[510:] == 1
    modelo.save(CARPETA_MODELOS / "revision_cv.keras")
    return {"exactitud": round(float(np.mean(predicho == esperado)), 4),
            **metricas_alerta(esperado, predicho)}


def main():
    keras.utils.set_random_seed(42)
    azar = np.random.default_rng(42)
    CARPETA_MODELOS.mkdir(exist_ok=True)
    metricas = {
        "version": VERSION, "datos": "simulados", "entrenamiento": 420,
        "validacion": 90, "prueba": 90,
        "tramites": entrenar_tramites(azar), "curriculos": entrenar_cv(azar),
    }
    resultado = json.dumps(metricas, indent=2, ensure_ascii=False)
    (CARPETA_MODELOS / "metricas.json").write_text(resultado + "\n", encoding="utf-8")
    print(resultado)


if __name__ == "__main__":
    main()