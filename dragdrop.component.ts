import { Component, ElementRef, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-flowchart',
  template: `
    <div style="display: flex;">
      <div style="width: 100px; border-right: 1px solid black; padding: 10px;">
        <div style="width: 50px; height: 30px; background: gray; margin-bottom: 10px; cursor: grab;" 
             draggable="true" (dragstart)="startDragNew($event)"></div>
      </div>
      <svg #svgContainer width="700" height="600" style="border:1px solid black;" (dragover)="allowDrop($event)" (drop)="dropNew($event)"></svg>
    </div>
  `,
  styles: [':host { display: block; user-select: none; }']
})
export class FlowchartComponent {
  @ViewChild('svgContainer', { static: true }) svgContainer!: ElementRef;
  private isDragging = false;
  private offsetX = 0;
  private offsetY = 0;
  private currentNode: SVGRectElement | null = null;
  private selectedNode: SVGRectElement | null = null;

  constructor(private renderer: Renderer2) {}

  startDrag(event: MouseEvent, node: SVGRectElement) {
    this.isDragging = true;
    this.currentNode = node;
    this.offsetX = event.clientX - node.x.baseVal.value;
    this.offsetY = event.clientY - node.y.baseVal.value;
    
    this.renderer.listen('window', 'mousemove', (e) => this.onDrag(e));
    this.renderer.listen('window', 'mouseup', () => this.stopDrag());
  }

  onDrag(event: MouseEvent) {
    if (!this.isDragging || !this.currentNode) return;
    this.renderer.setAttribute(this.currentNode, 'x', (event.clientX - this.offsetX).toString());
    this.renderer.setAttribute(this.currentNode, 'y', (event.clientY - this.offsetY).toString());
    this.updateLinks();
  }

  stopDrag() {
    this.isDragging = false;
    this.currentNode = null;
  }

  startDragNew(event: DragEvent) {
    event.dataTransfer?.setData('text/plain', 'rectangle');
  }

  allowDrop(event: DragEvent) {
    event.preventDefault();
  }

  dropNew(event: DragEvent) {
    event.preventDefault();
    const svg = this.svgContainer.nativeElement;
    const rect = this.renderer.createElement('rect', 'svg');
    this.renderer.setAttribute(rect, 'x', event.offsetX.toString());
    this.renderer.setAttribute(rect, 'y', event.offsetY.toString());
    this.renderer.setAttribute(rect, 'width', '100');
    this.renderer.setAttribute(rect, 'height', '50');
    this.renderer.setAttribute(rect, 'fill', 'blue');
    this.renderer.setAttribute(rect, 'cursor', 'pointer');
    this.renderer.listen(rect, 'mousedown', (e) => this.selectNode(e, rect));
    this.renderer.appendChild(svg, rect);
    this.addIcons(rect);
  }

  selectNode(event: MouseEvent, node: SVGRectElement) {
    if (this.selectedNode) {
      this.createLink(this.selectedNode, node);
      this.selectedNode = null;
    } else {
      this.selectedNode = node;
    }
  }

  createLink(node1: SVGRectElement, node2: SVGRectElement) {
    const svg = this.svgContainer.nativeElement;
    const line = this.renderer.createElement('line', 'svg');
    this.renderer.setAttribute(line, 'stroke', 'black');
    this.renderer.setAttribute(line, 'stroke-width', '2');
    this.renderer.setAttribute(line, 'marker-end', 'url(#arrow)');
    this.renderer.appendChild(svg, line);
    this.updateLinkPosition(line, node1, node2);
  }

  updateLinkPosition(line: SVGLineElement, node1: SVGRectElement, node2: SVGRectElement) {
    const x1 = parseFloat(node1.getAttribute('x')!) + 50;
    const y1 = parseFloat(node1.getAttribute('y')!) + 25;
    const x2 = parseFloat(node2.getAttribute('x')!) + 50;
    const y2 = parseFloat(node2.getAttribute('y')!) + 25;
    this.renderer.setAttribute(line, 'x1', x1.toString());
    this.renderer.setAttribute(line, 'y1', y1.toString());
    this.renderer.setAttribute(line, 'x2', x2.toString());
    this.renderer.setAttribute(line, 'y2', y2.toString());
  }

  updateLinks() {
    const lines = this.svgContainer.nativeElement.querySelectorAll('line');
    lines.forEach((line: SVGLineElement) => {
      const node1 = this.svgContainer.nativeElement.querySelector(`[x="${line.getAttribute('x1')}"]`);
      const node2 = this.svgContainer.nativeElement.querySelector(`[x="${line.getAttribute('x2')}"]`);
      if (node1 && node2) {
        this.updateLinkPosition(line, node1 as SVGRectElement, node2 as SVGRectElement);
      }
    });
  }

  addIcons(node: SVGRectElement) {
    const svg = this.svgContainer.nativeElement;
    const deleteIcon = this.renderer.createElement('text', 'svg');
    this.renderer.setAttribute(deleteIcon, 'x', (parseFloat(node.getAttribute('x')!) + 85).toString());
    this.renderer.setAttribute(deleteIcon, 'y', (parseFloat(node.getAttribute('y')!) + 15).toString());
    this.renderer.setAttribute(deleteIcon, 'fill', 'red');
    this.renderer.setAttribute(deleteIcon, 'font-size', '16');
    this.renderer.setAttribute(deleteIcon, 'cursor', 'pointer');
    this.renderer.listen(deleteIcon, 'click', () => this.deleteNode(node, deleteIcon));
    deleteIcon.textContent = 'X';
    this.renderer.appendChild(svg, deleteIcon);
  }

  deleteNode(node: SVGRectElement, icon: SVGTextElement) {
    this.renderer.removeChild(this.svgContainer.nativeElement, node);
    this.renderer.removeChild(this.svgContainer.nativeElement, icon);
  }
}
