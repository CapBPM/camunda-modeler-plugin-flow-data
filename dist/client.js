/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./client/data-flow-plugin/FlowDataPlugin.js":
/*!***************************************************!*\
  !*** ./client/data-flow-plugin/FlowDataPlugin.js ***!
  \***************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
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
    const exampleData = this.findExampleData(flowEl) || this.findExampleData(flowEl.source);
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

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  __init__: [PLUGIN_NAME],
  [PLUGIN_NAME]: ['type', FlowDataPlugin]
});

/***/ }),

/***/ "./node_modules/camunda-modeler-plugin-helpers/index.js":
/*!**************************************************************!*\
  !*** ./node_modules/camunda-modeler-plugin-helpers/index.js ***!
  \**************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getModelerDirectory": () => (/* binding */ getModelerDirectory),
/* harmony export */   "getPluginsDirectory": () => (/* binding */ getPluginsDirectory),
/* harmony export */   "registerBpmnJSModdleExtension": () => (/* binding */ registerBpmnJSModdleExtension),
/* harmony export */   "registerBpmnJSPlugin": () => (/* binding */ registerBpmnJSPlugin),
/* harmony export */   "registerClientExtension": () => (/* binding */ registerClientExtension),
/* harmony export */   "registerClientPlugin": () => (/* binding */ registerClientPlugin),
/* harmony export */   "registerCloudBpmnJSModdleExtension": () => (/* binding */ registerCloudBpmnJSModdleExtension),
/* harmony export */   "registerCloudBpmnJSPlugin": () => (/* binding */ registerCloudBpmnJSPlugin),
/* harmony export */   "registerDmnJSModdleExtension": () => (/* binding */ registerDmnJSModdleExtension),
/* harmony export */   "registerDmnJSPlugin": () => (/* binding */ registerDmnJSPlugin),
/* harmony export */   "registerPlatformBpmnJSModdleExtension": () => (/* binding */ registerPlatformBpmnJSModdleExtension),
/* harmony export */   "registerPlatformBpmnJSPlugin": () => (/* binding */ registerPlatformBpmnJSPlugin)
/* harmony export */ });
/**
 * Validate and register a client plugin.
 *
 * @param {Object} plugin
 * @param {String} type
 */
function registerClientPlugin(plugin, type) {
  var plugins = window.plugins || [];
  window.plugins = plugins;

  if (!plugin) {
    throw new Error('plugin not specified');
  }

  if (!type) {
    throw new Error('type not specified');
  }

  plugins.push({
    plugin: plugin,
    type: type
  });
}

/**
 * Validate and register a client plugin.
 *
 * @param {import('react').ComponentType} extension
 *
 * @example
 *
 * import MyExtensionComponent from './MyExtensionComponent';
 *
 * registerClientExtension(MyExtensionComponent);
 */
function registerClientExtension(component) {
  registerClientPlugin(component, 'client');
}

/**
 * Validate and register a bpmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerBpmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const BpmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerBpmnJSPlugin(BpmnJSModule);
 */
function registerBpmnJSPlugin(module) {
  registerClientPlugin(module, 'bpmn.modeler.additionalModules');
}

/**
 * Validate and register a platform specific bpmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerPlatformBpmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const BpmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerPlatformBpmnJSPlugin(BpmnJSModule);
 */
function registerPlatformBpmnJSPlugin(module) {
  registerClientPlugin(module, 'bpmn.platform.modeler.additionalModules');
}

/**
 * Validate and register a cloud specific bpmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerCloudBpmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const BpmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerCloudBpmnJSPlugin(BpmnJSModule);
 */
function registerCloudBpmnJSPlugin(module) {
  registerClientPlugin(module, 'bpmn.cloud.modeler.additionalModules');
}

/**
 * Validate and register a bpmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerBpmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerBpmnJSModdleExtension(moddleDescriptor);
 */
function registerBpmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'bpmn.modeler.moddleExtension');
}

/**
 * Validate and register a platform specific bpmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerPlatformBpmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerPlatformBpmnJSModdleExtension(moddleDescriptor);
 */
function registerPlatformBpmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'bpmn.platform.modeler.moddleExtension');
}

/**
 * Validate and register a cloud specific bpmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerCloudBpmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerCloudBpmnJSModdleExtension(moddleDescriptor);
 */
function registerCloudBpmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'bpmn.cloud.modeler.moddleExtension');
}

/**
 * Validate and register a dmn-moddle extension plugin.
 *
 * @param {Object} descriptor
 *
 * @example
 * import {
 *   registerDmnJSModdleExtension
 * } from 'camunda-modeler-plugin-helpers';
 *
 * var moddleDescriptor = {
 *   name: 'my descriptor',
 *   uri: 'http://example.my.company.localhost/schema/my-descriptor/1.0',
 *   prefix: 'mydesc',
 *
 *   ...
 * };
 *
 * registerDmnJSModdleExtension(moddleDescriptor);
 */
function registerDmnJSModdleExtension(descriptor) {
  registerClientPlugin(descriptor, 'dmn.modeler.moddleExtension');
}

/**
 * Validate and register a dmn-js plugin.
 *
 * @param {Object} module
 *
 * @example
 *
 * import {
 *   registerDmnJSPlugin
 * } from 'camunda-modeler-plugin-helpers';
 *
 * const DmnJSModule = {
 *   __init__: [ 'myService' ],
 *   myService: [ 'type', ... ]
 * };
 *
 * registerDmnJSPlugin(DmnJSModule, [ 'drd', 'literalExpression' ]);
 * registerDmnJSPlugin(DmnJSModule, 'drd')
 */
function registerDmnJSPlugin(module, components) {

  if (!Array.isArray(components)) {
    components = [ components ]
  }

  components.forEach(c => registerClientPlugin(module, `dmn.modeler.${c}.additionalModules`)); 
}

/**
 * Return the modeler directory, as a string.
 *
 * @deprecated Will be removed in future Camunda Modeler versions without replacement.
 *
 * @return {String}
 */
function getModelerDirectory() {
  return window.getModelerDirectory();
}

/**
 * Return the modeler plugin directory, as a string.
 *
 * @deprecated Will be removed in future Camunda Modeler versions without replacement.
 *
 * @return {String}
 */
function getPluginsDirectory() {
  return window.getPluginsDirectory();
}

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!*************************!*\
  !*** ./client/index.js ***!
  \*************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! camunda-modeler-plugin-helpers */ "./node_modules/camunda-modeler-plugin-helpers/index.js");
/* harmony import */ var _data_flow_plugin_FlowDataPlugin__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./data-flow-plugin/FlowDataPlugin */ "./client/data-flow-plugin/FlowDataPlugin.js");



(0,camunda_modeler_plugin_helpers__WEBPACK_IMPORTED_MODULE_0__.registerBpmnJSPlugin)(_data_flow_plugin_FlowDataPlugin__WEBPACK_IMPORTED_MODULE_1__["default"]);

})();

/******/ })()
;
//# sourceMappingURL=client.js.map