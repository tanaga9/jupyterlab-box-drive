FROM continuumio/miniconda3

RUN . /root/.bashrc && \
    conda init bash && \
    conda create -n jupyterlab-ext --override-channels --strict-channel-priority \
        -c conda-forge -c nodefaults jupyterlab=3 cookiecutter nodejs jupyter-packaging git && \
    conda activate jupyterlab-ext
    # pip install jupyterlite
ENV PATH $PATH:/opt/conda/envs/jupyterlab-ext/bin
RUN git clone https://github.com/box-community/box-javascript-sdk.git /box-javascript-sdk && \
    cd /box-javascript-sdk && \
    npm install && \
    npm run build

COPY pyproject.toml package.json LICENSE README.md /work/
RUN cd /work && pip install -ve .

WORKDIR /work
EXPOSE 8888

COPY . /work

CMD pip install -ve . && \
    jupyter labextension develop --overwrite . && \
    cp /box-javascript-sdk/lib/BoxSdk.min.js /work/src/BoxSdk.js && \
    cp /work/src/auth.html /opt/conda/envs/jupyterlab-ext/share/jupyter/lab/static/. && \
    jupyter lab --no-browser --port=8888 --ip=0.0.0.0 --allow-root --NotebookApp.token=''
    # jupyter lite build --minimize=False --force --output-dir build  && \
    # cp /box-javascript-sdk/lib/BoxSdk.min.js /work/build/BoxSdk.js && \
    # jupyter lite serve --port=8888 --ip=0.0.0.0 --output-dir build
