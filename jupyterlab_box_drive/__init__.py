from ._version import __version__


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-box-drive"
    }]


async def input_oauth2info(clear=True):
    import types, json

    message = "OAuth2 info"

    if isinstance(input, types.FunctionType):
        oauth2json = await input(message) # JupyterLite
    else:
        oauth2json = input(message) # JupyterLab

    if oauth2json == "":
        return None

    oauth2dict = json.loads(oauth2json)

    if clear:
        from IPython.display import clear_output, display, Javascript
        clear_output()
        display(Javascript('navigator.clipboard.writeText("")'))

    return oauth2dict
