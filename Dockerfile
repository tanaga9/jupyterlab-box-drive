FROM python:3.10
RUN pip install -U jupyterlab~=3.1 jupyterlite jupyterlite-core==0.1.0 jupyterlite-pyodide-kernel==0.1.0
RUN pip install jupyterlab-box-drive

# build jupyterlab-box-drive
# --------------------------

# RUN apt update && apt install -y curl nodejs npm git
# RUN npm install n -g && n lts && apt purge -y nodejs npm
# RUN pip uninstall -y jupyterlab-box-drive
# RUN pip install build
# # COPY . /work
# RUN git clone https://github.com/tanaga9/jupyterlab-box-drive.git /work
# COPY ./src /work/src
# RUN cd /work && pip install . && python -m build

CMD jupyter lite build --output-dir _site && jupyter lite serve --port=8888 --ip=0.0.0.0 --output-dir _site

# docker build -t jupyterlite . && docker run --rm -p 8888:8888 jupyterlite
