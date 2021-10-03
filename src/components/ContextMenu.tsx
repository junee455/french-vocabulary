import React from "react";
import "./ContextMenu.scss";

export interface ContextMenuProps {
  items?: {
    label: string;
    callback: () => void;
  }[];
  event?: React.MouseEvent;
}

export interface ContextMenuState {
  showMenu: boolean;
  lastEvent?: React.MouseEvent;
  coords?: { x: number; y: number } | null;
}

export class ContextMenu extends React.Component<
  ContextMenuProps,
  ContextMenuState
> {
  public showMenu(coords: { x: number; y: number }) {
    this.setState({ showMenu: true, coords: coords });
  }

  public hideMenu() {
    this.setState({ showMenu: false, coords: null });
  }

  public clickOutside(event: React.MouseEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.hideMenu();
  }

  constructor(props: ContextMenuProps) {
    super(props);
    this.state = { showMenu: false };
  }

  public render() {
    if (this.props.event && this.props.event !== this.state.lastEvent) {
      this.setState({
        showMenu: !this.state.showMenu,
        lastEvent: this.props.event,
      });
    }

    if (this.state.showMenu) {
      const { pageX = 0, pageY = 0 } = this.props.event || {};
      return (
        <div>
          <div
            className="context-menu-container"
            onContextMenu={(event) => this.clickOutside(event)}
            onMouseDown={(event) => this.clickOutside(event)}
          ></div>

          <div
            style={{
              position: "fixed",
              top: pageY.toString() + "px",
              left: pageX.toString() + "px",
            }}
            className="contextMenu"
          >
            {this.props.items?.map((menuItem) => (
              <div
                onClick={() => {
                  menuItem.callback();
                  this.hideMenu();
                }}
              >
                {menuItem.label}
              </div>
            ))}
          </div>
        </div>
      );
    } else {
      return "";
    }
  }
}
