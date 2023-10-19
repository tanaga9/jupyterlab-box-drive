from ._version import __version__


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-box-drive"
    }]


from dataclasses import dataclass
from typing import Dict

@dataclass
class Input:
    oauth: Dict

async def input(clear: bool=True)-> Input | None:
    import types, json

    message = "OAuth2 info"

    if isinstance(input, types.FunctionType):
        s = await input(message) # JupyterLite
    else:
        s = input(message) # JupyterLab

    if s == "":
        return None

    d = json.loads(s)
    i = Input(d["oauth"])

    if clear:
        from IPython.display import clear_output, display, Javascript
        clear_output()
        display(Javascript('navigator.clipboard.writeText("")'))

    return i

