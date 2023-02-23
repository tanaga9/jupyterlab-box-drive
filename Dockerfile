FROM continuumio/miniconda3

RUN . /root/.bashrc && \
    conda init bash && \
    conda create -n jupyterlab-ext --override-channels --strict-channel-priority \
        -c conda-forge -c nodefaults jupyterlab=3 cookiecutter nodejs jupyter-packaging git && \
    conda activate jupyterlab-ext

COPY pyproject.toml package.json LICENSE README.md /work/
RUN cd /work && pip install -ve .

WORKDIR /work
EXPOSE 8888
ENV PATH $PATH:/opt/conda/envs/jupyterlab-ext/bin

COPY . /work

CMD pip install -ve . && \
    jupyter labextension develop --overwrite . && \
    jupyter lab --no-browser --port=8888 --ip=0.0.0.0 --allow-root --NotebookApp.token=''
