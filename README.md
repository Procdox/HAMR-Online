# HAMR-Online

HAMR-Online is an in-browser map maker that allows you to draw room outlines and building blueprints via 2d widgets. It then automatically generates 3d geometry and entities and exports them to a VMF.

It is not currently in development.

More info here: https://tf2maps.net/downloads/hamr-online-a-map-prototyping-tool.2462/

## Installation

Use the package manager [pip](https://pip.pypa.io/en/stable/) to install foobar.

```bash
pip install foobar
```

## Usage

To Use:

    Download the project and open index.html in a modern web browser.
    Ensure Adblock is off (it breaks saving and loading, there are no ads.)
    Make sure Hardware Acceleration / webGL is enabled for your browser.

The UI starts with a world, which you can add buildings to.
Buildings are composed of:

    Floors (the outer wall)
    Rooms (inner areas)
    Portals (windows/doors)

Floors and Rooms have a drag-able border that you add/delete points to with the add / remove tools.

===============================================

Controls:

Left click: edit / drag
Middle click: select
WASD: fly around
Arrow Keys: look around
Scroll: fly forward and back

You can also select from the hierarchy on the right

===============================================

To Save:

    Click Save
    Right click the newly opened tab
    Click "Save As"
    Save like you would any file

To Export:

    Click Save
    Right click the newly opened tab
    Click "Save As"
    Open the file in Hammer

## License
[MIT](https://choosealicense.com/licenses/mit/)
