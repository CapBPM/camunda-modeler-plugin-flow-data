const PLUGIN_NAME = 'CAMUNDA_MODELER_PLUGIN_VIEW_INPUTS_AND_OUTPUTS';

class FlowDataPlugin {
  // Map<string, FlowDataBadge>
  overlays = new Map();

  constructor(eventBus, overlays, elementRegistry, canvas) {
    this.modelerEventBus = eventBus;
    this.modelerOverlays = overlays;
    this.modelerElementRegistry = elementRegistry;
    this.onConnectionAddRemove();
    this.onConnectionChanged();
    this.onElementChanged();
    this.markerToggle = canvas.toggleMarker.bind(canvas);
  }

  onElementChanged() {
    this.modelerEventBus.on(['element.changed'], ({ element }) => {
      const { outgoing } = element;
      outgoing?.forEach((flow) => {
        this.removeFlowData(flow);
        this.addFlowData(flow);
      });
    });
  }

  onConnectionChanged() {
    this.modelerEventBus.on(['connection.changed'], ({ element }) => {
      this.updateFlowData(element);
    });
  }

  onConnectionAddRemove() {
    this.modelerEventBus.on(['connection.added', 'connection.removed'], ({ element, type }) => {
      if (type === 'connection.added') {
        this.addFlowData(element);
      }
      if (type === 'connection.removed') {
        this.removeFlowData(element);
      }
    });
  }

  updateFlowData(flowEl) {
    const isOpen = !!this.overlays.get(flowEl.id)?.isOpen;
    this.removeFlowData(flowEl);
    this.addFlowData(flowEl, isOpen);
  }

  addFlowData(flowEl, isOpen = false) {
    const exampleData = this.findExampleData(flowEl.source);
    if (this.isValidData(exampleData)) {
      const flowDataBadge = new FlowDataBadge(flowEl, this.modelerOverlays, this.markerToggle, exampleData, isOpen);
      this.overlays.set(flowEl.id, flowDataBadge);
    }
  }

  removeFlowData(flowEl) {
    const flowDataBadge = this.overlays.get(flowEl.id);
    if (flowDataBadge) {
      this.overlays.delete(flowEl.id);
      this.modelerOverlays.remove(flowDataBadge.overlayId);
      flowDataBadge.destroy();
    }
  }

  isValidData(exampleData) {
    try {
      JSON.parse(exampleData);
      return true;
    } catch (error) {
      return false;
    }
  }

  findExampleData(element) {
    const values = element?.businessObject?.extensionElements?.values
    if (!values?.length) return '';
    for (const val of values) {
      for (const property of val.properties || []) {
        if (property.name === 'camundaModeler:exampleOutputJson') {
          return property.value;
        }
      }
    }
  }
}

FlowDataPlugin.$inject = [
  'eventBus',
  'overlays',
  'elementRegistry',
  'canvas',
];

class FlowDataBadge {

  constructor(flow, overlays, toggleMarker, data, isOpen = false) {
    this.flow = flow;
    this.isOpen = isOpen;
    this.markerToggle = toggleMarker;
    this.data = data;
    this.position = { top: this.getTopShifth(), left: this.getLeftShift() };
    this.overlayId = overlays.add(flow, { position: this.position, html: this.getHtml(data) });
    this.badge = overlays.get(this.overlayId).htmlContainer;
    this.toggleBadgeView();
    this.onToggleBtnEvents();
  }

  onToggleBtnMouseenter = () => { this.markerToggle(this.flow, 'flow-highlight'); }
  onToggleBtnMouseleave = () => { this.markerToggle(this.flow, 'flow-highlight'); }
  onToggleBtnClick = () => {
    this.isOpen = !this.isOpen;
    this.toggleBadgeView();
  }

  destroy() {
    this.toggleBtn.removeEventListener('mouseenter', this.onToggleBtnMouseenter);
    this.toggleBtn.removeEventListener('mouseleave', this.onToggleBtnMouseleave);
    this.toggleBtn.removeEventListener('click', this.onToggleBtnClick);
  }

  get toggleBtn() {
    return this.badge.querySelector('.flow-data-toggle-btn');
  }

  get content() {
    return this.badge.querySelector('.flow-data-content');
  }

  getLeftShift() {
    const coordinatesX = this.flow.waypoints.map(({ x }) => x);
    const [pointA, pointB] = this.flow.waypoints;
    const direction = this.getLineDirection(pointA, pointB);
    const minX = Math.min(...coordinatesX);
    const shift = direction === 'W' ? -65 : 15;
    return pointA.x - minX + shift;
  }

  getTopShifth() {
    const coordinatesY = this.flow.waypoints.map(({ y }) => y);
    const [pointA, pointB] = this.flow.waypoints;
    const direction = this.getLineDirection(pointA, pointB);
    const minY = Math.min(...coordinatesY);
    const shift = direction === 'N' ? -25 : 25;
    return pointA.y - minY + shift;
  }

  getLineDirection(pointA, pointB) {
    if (pointA.x === pointB.x) {
      if (pointA.y > pointB.y) return 'N';
      if (pointA.y < pointB.y) return 'S';
    }
    if (pointA.y === pointB.y) {
      if (pointA.x > pointB.x) return 'W';
      if (pointA.x < pointB.x) return 'E';
    }
    if (pointA.x > pointB.x) {
      if (pointA.y > pointB.y) return 'NW';
      if (pointA.y < pointB.y) return 'SW';
    }
    if (pointA.x < pointB.x) {
      if (pointA.y > pointA.x) return 'NE';
      if (pointA.y < pointA.x) return 'SE';
    }
  }

  getHtml(content) {
    const parsed = JSON.parse(content);
    const pretty = JSON.stringify(parsed, null, 2);
    const btnContent = JSON.stringify(parsed);
    return `
      <div class="flow-data">
        <div class="flow-data-content">
          <pre>${pretty}</pre>
        </div>
        <button class="flow-data-toggle-btn">${btnContent}</button>
      </div>`
  }

  onToggleBtnEvents() {
    this.toggleBtn.addEventListener('mouseenter', this.onToggleBtnMouseenter);
    this.toggleBtn.addEventListener('mouseleave', this.onToggleBtnMouseleave);
    this.toggleBtn.addEventListener('click', this.onToggleBtnClick);
  }

  toggleBadgeView() {
    this.toggleBtn.textContent = this.isOpen ? 'Hide' : JSON.stringify(JSON.parse(this.data));
    this.isOpen ? this.showFlowDataContent() : this.hideFlowDataContent();
  }

  showFlowDataContent() {
    this.content.style.padding = `5px`;
    this.content.style.width = `${this.content.scrollWidth + 5}px`;
    this.content.style.height = `${this.content.scrollHeight}px`;
    this.content.style.bottom = `${-1 * (this.content.scrollHeight + 5)}px`;
    this.content.style.left = `${-((this.content.scrollWidth / 2) - 25)}px`;
  }

  hideFlowDataContent() {
    this.content.style.width = '0px';
    this.content.style.height = '0px';
    this.content.style.padding = `0px`;
  }
}

export default {
  __init__: [PLUGIN_NAME],
  [PLUGIN_NAME]: ['type', FlowDataPlugin]
};