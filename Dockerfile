FROM python:3.10

COPY requirements_for_jupyter_lite_build.txt /
RUN pip install -r /requirements_for_jupyter_lite_build.txt
RUN pip install jupyterlab-box-drive

# build jupyterlab-box-drive
# --------------------------

# RUN apt update && apt install -y nodejs npm curl git
# RUN npm install n -g && n lts && apt purge -y nodejs npm
# RUN pip uninstall -y jupyterlab-box-drive
# RUN pip install build
# # COPY . /jupyterlab-box-drive
# RUN git clone https://github.com/tanaga9/jupyterlab-box-drive.git /jupyterlab-box-drive
# COPY ./src /jupyterlab-box-drive/src
# RUN cd /jupyterlab-box-drive && pip install .
# # RUN python -m build

CMD jupyter lite build --output-dir _site && jupyter lite serve --port=8888 --ip=0.0.0.0 --output-dir _site

# docker build -t jupyterlite . && docker run --rm -p 8888:8888 jupyterlite
# docker build -t jupyterlite . && rm -rf work && sleep 1 && docker run --rm -p 8888:8888 -v $PWD/work:/work -w /work jupyterlite
