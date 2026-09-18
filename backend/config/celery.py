"""Configuracao da aplicacao Celery.

O Redis atua como broker: a API apenas publica a mensagem e responde rapido;
o worker consome a fila e executa o processamento fora do ciclo HTTP.
"""

import os

from celery import Celery

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

app = Celery("docflow")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@app.task(name="config.debug_task")
def debug_task() -> str:
    return "ok"
