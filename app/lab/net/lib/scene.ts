import {
  type BoundaryLines,
  boundaryFromMargins,
  computeGridDimensions,
  diamondNodePosition,
  drawBoundary,
  Line,
} from "./boundary";
import { LINE_HANDLES, type LineHandle } from "./line-handle";
import { Link } from "./link";
import { Node } from "./node";

export type NetSettings = {
  cellSize: number;
  spring: number;
  compressSpring: number;
  damp: number;
  gravity: number;
  constraintPasses: number;
  nodeRadius: number;
};

const DEFAULT_BOUNDARY_MARGINS = {
  top: 0.1,
  right: 0.1,
  bottom: 0.1,
  left: 0.1,
};

export const NET_DEFAULTS: NetSettings = {
  cellSize: 40,
  spring: 0.85,
  compressSpring: 0.55,
  damp: 0.98,
  gravity: 0.4,
  constraintPasses: 6,
  nodeRadius: 2,
};

const POINTER_RADIUS = 44;
const POINTER_STRENGTH = 0.9;
const CUT_RADIUS = 14;

export type PointerMode = "handle" | "cut" | null;

export class Scene {
  nodes: Node[] = [];
  links: Link[] = [];
  width = 0;
  height = 0;
  cols = 0;
  rows = 0;
  boundary: BoundaryLines = {
    top: new Line(0, 0, 0, 0),
    right: new Line(0, 0, 0, 0),
    bottom: new Line(0, 0, 0, 0),
    left: new Line(0, 0, 0, 0),
  };
  settings: NetSettings;
  private activeHandle: LineHandle | null = null;
  private handleDragOffset = { x: 0, y: 0 };
  private pointerX = 0;
  private pointerY = 0;
  private pointerHovering = false;
  private pointerMode: PointerMode = null;

  constructor(settings: NetSettings = NET_DEFAULTS) {
    this.settings = { ...settings };
  }

  reset(width: number, height: number, settings?: NetSettings) {
    if (settings) {
      this.settings = { ...settings };
    }

    this.width = width;
    this.height = height;
    this.buildGrid();
  }

  private buildGrid() {
    const { cellSize } = this.settings;
    this.boundary = boundaryFromMargins(
      this.width,
      this.height,
      DEFAULT_BOUNDARY_MARGINS,
    );

    const { cols, rows } = computeGridDimensions(this.boundary, cellSize);

    this.cols = cols;
    this.rows = rows;
    this.nodes = [];
    this.links = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isAnchor =
          row === 0 || row === rows - 1 || col === 0 || col === cols - 1;

        const { x, y } = diamondNodePosition(
          col,
          row,
          cols,
          rows,
          this.boundary,
        );
        this.nodes.push(new Node(x, y, isAnchor));
      }
    }

    const index = (col: number, row: number) => row * cols + col;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const isOddRow = row % 2 === 1;

        if (row > 0) {
          this.links.push(
            new Link(
              this.nodes[index(col, row)],
              this.nodes[index(col, row - 1)],
            ),
          );

          if (isOddRow && col + 1 < cols) {
            this.links.push(
              new Link(
                this.nodes[index(col, row)],
                this.nodes[index(col + 1, row - 1)],
              ),
            );
          }

          if (!isOddRow && col > 0) {
            this.links.push(
              new Link(
                this.nodes[index(col, row)],
                this.nodes[index(col - 1, row - 1)],
              ),
            );
          }
        }
      }
    }
  }

  syncAnchorNodes() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const isAnchor =
          row === 0 ||
          row === this.rows - 1 ||
          col === 0 ||
          col === this.cols - 1;
        if (!isAnchor) continue;

        const node = this.nodes[row * this.cols + col];
        const { x, y } = diamondNodePosition(
          col,
          row,
          this.cols,
          this.rows,
          this.boundary,
        );
        node.setAnchorPosition(x, y);
      }
    }
  }

  pickHandle(x: number, y: number) {
    for (const kind of ["start", "end", "control1", "control2"] as const) {
      for (const handle of LINE_HANDLES) {
        if (handle.kind !== kind) continue;
        if (handle.contains(this.boundary, x, y)) {
          return handle;
        }
      }
    }
    return null;
  }

  pointerDown(x: number, y: number): PointerMode {
    const handle = this.pickHandle(x, y);
    if (handle) {
      const position = handle.position(this.boundary);
      this.activeHandle = handle;
      this.handleDragOffset = {
        x: position.x - x,
        y: position.y - y,
      };
      this.pointerMode = "handle";
      return "handle";
    }

    this.pointerMode = "cut";
    this.cutLinksAt(x, y);
    return "cut";
  }

  pointerMove(x: number, y: number) {
    if (this.pointerMode === "handle" && this.activeHandle) {
      this.activeHandle.move(this.boundary, {
        x: x + this.handleDragOffset.x,
        y: y + this.handleDragOffset.y,
      });
      this.syncAnchorNodes();
      return;
    }

    if (this.pointerMode === "cut") {
      this.cutLinksAt(x, y);
    }
  }

  pointerUp() {
    this.activeHandle = null;
    this.pointerMode = null;
  }

  setPointer(x: number, y: number, hovering: boolean) {
    this.pointerX = x;
    this.pointerY = y;
    this.pointerHovering = hovering;
  }

  private applyPointerForce() {
    if (!this.pointerHovering || this.pointerMode !== null) return;

    for (const node of this.nodes) {
      node.pushFromPointer(
        this.pointerX,
        this.pointerY,
        POINTER_RADIUS,
        POINTER_STRENGTH,
      );
    }
  }

  private cutLinksAt(x: number, y: number) {
    this.links = this.links.filter(
      (link) => link.distanceToPoint(x, y) > CUT_RADIUS,
    );
  }

  private gridSettingsChanged(next: NetSettings) {
    return next.cellSize !== this.settings.cellSize;
  }

  syncSettings(settings: NetSettings) {
    const shouldRebuild = this.gridSettingsChanged(settings);
    this.settings = { ...settings };
    if (shouldRebuild) {
      this.buildGrid();
    }
  }

  step() {
    const { spring, compressSpring, damp, gravity, constraintPasses } =
      this.settings;

    this.applyPointerForce();

    for (const node of this.nodes) {
      node.integrate(damp, gravity);
    }

    for (const link of this.links) {
      link.integrate(damp, gravity);
    }

    for (let pass = constraintPasses; pass--; ) {
      for (const link of this.links) {
        link.solve(spring, compressSpring);
        link.solveMidpoint(spring, compressSpring);
      }
    }

    for (const node of this.nodes) {
      node.lockAnchor();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, this.width, this.height);

    for (const link of this.links) {
      link.draw(ctx);
    }

    for (const handle of LINE_HANDLES) {
      handle.draw(ctx, this.boundary);
    }
  }

  drawDebug(ctx: CanvasRenderingContext2D) {
    drawBoundary(ctx, this.boundary);

    for (const node of this.nodes) {
      node.drawDebug(ctx, this.settings.nodeRadius);
    }
  }
}

export function createScene(
  width: number,
  height: number,
  settings?: NetSettings,
) {
  const scene = new Scene(settings);
  scene.reset(width, height);
  return scene;
}

// Re-export for tests or UI
export { computeGridDimensions } from "./boundary";
