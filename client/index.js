import { registerBpmnJSPlugin, registerClientExtension } from 'camunda-modeler-plugin-helpers';
import FlowDataPlugin from './data-flow-plugin/FlowDataPlugin';
import FlowdataPluginToggle from './data-flow-plugin/FlowDataPluginToggle';

registerBpmnJSPlugin(FlowDataPlugin);
registerClientExtension(FlowdataPluginToggle)
