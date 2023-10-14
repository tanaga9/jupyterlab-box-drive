FROM continuumio/miniconda3

RUN . /root/.bashrc && \
    conda init bash && \
    conda create -n jupyterlab-ext --override-channels --strict-channel-priority \
        -c conda-forge -c nodefaults jupyterlab=3 cookiecutter nodejs jupyter-packaging git && \
    conda activate jupyterlab-ext
ENV PATH $PATH:/opt/conda/envs/jupyterlab-ext/bin
RUN git clone https://github.com/box-community/box-javascript-sdk.git /box-javascript-sdk && \
    cd /box-javascript-sdk && \
    npm install && \
    npm run build

RUN apt update && apt-get install -y gcc python3-dev supervisor
COPY pyproject.toml package.json LICENSE README.md /preinstall/
RUN cd /preinstall && pip install -ve .

WORKDIR /work
EXPOSE 8888 8889 9001

RUN pip install build jupyterlab-favorites ipydrawio jupyterlite

# COPY . /work
RUN git clone https://github.com/tanaga9/jupyterlab-box-drive.git /work

CMD pip install -ve . && \
    cp /box-javascript-sdk/lib/BoxSdk.min.js /work/src/. && \
    /usr/bin/supervisord -c /work/supervisord.conf
