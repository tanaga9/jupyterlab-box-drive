from ._version import __version__


def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "jupyterlab-box-drive"
    }]

# ----------------------------------------

from typing import Dict, Self
import types, json

class _OAuth(Dict):
    @property
    def access_token(self: Self): return self["access_token"]

class JupyterlabBoxDrive:
    oauth: _OAuth | None = None

    def __init__(self: Self) -> None:
        pass

    async def input(self: Self, clear: bool=True)-> Self:
        message = "OAuth2 info"

        if isinstance(input, types.FunctionType):
            s = await input(message) # JupyterLite
        else:
            s = input(message) # JupyterLab

        if s == "":
            return self

        d = json.loads(s)
        self.oauth = _OAuth(d["oauth"])

        if clear:
            from IPython.display import clear_output, display, Javascript
            clear_output()
            display(Javascript('navigator.clipboard.writeText("")'))

        return self
