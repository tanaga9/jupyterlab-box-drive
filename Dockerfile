FROM python:3.10

COPY requirements_for_jupyter_lite_build.txt /
RUN pip install -r /requirements_for_jupyter_lite_build.txt
RUN pip install jupyterlab-box-drive
RUN mkdir /build
COPY ./files /build/files

CMD cd /build && jupyter lite build --output-dir _site && ln -sr dist _site/dist && jupyter lite serve --port=8888 --ip=0.0.0.0 --output-dir _site
# CMD jupyter lab --port=8888 --ip=0.0.0.0 --allow-root --NotebookApp.token='' --NotebookApp.notebook_dir='/build/files'


# build jupyterlab-box-drive
# --------------------------

# RUN apt update && apt install -y nodejs npm curl git
# RUN npm install n -g && n lts && apt purge -y nodejs npm
# RUN pip uninstall -y jupyterlab-box-drive && rm -r /build/files
# RUN pip install build
# # COPY . /build
# RUN git clone https://github.com/tanaga9/jupyterlab-box-drive.git /build
# COPY ./src                       /build/src
# COPY ./jupyterlab_box_drive/*.py /build/jupyterlab_box_drive
# COPY ./files                     /build/files
# RUN cd /build && pip install .
# RUN cd /build && python -m build
