import React, { Fragment, PureComponent } from 'camunda-modeler-plugin-helpers/react';
import { Fill } from 'camunda-modeler-plugin-helpers/components';

export default class FlowdataPluginToggle extends PureComponent {
  tabStates = new Map();
  currentTabId = '';

  constructor(props) {
    super(props);
    this.state = { toggle: false };
    this.subscribe = props.subscribe;
    this.onModelerCreated();
    this.onTabChange();
  }

  onModelerCreated() {
    this.subscribe('bpmn.modeler.created', (event) => {
      const { modeler, tab } = event;
      this.tabStates.set(tab.id, { modeler, toggle: false });
      this.setEventBus(modeler);
    });
  }

  onTabChange() {
    this.subscribe('app.activeTabChanged', ({ activeTab }) => {
      this.rememberToggleStateForTab(this.currentTabId);
      this.currentTabId = activeTab.id;
      this.applyTabState(activeTab.id);
    });
  }

  applyTabState(tabId) {
    const tabState = this.tabStates.get(tabId);
    if (tabState) {
      const { modeler, toggle } = tabState;
      this.setEventBus(modeler);
      this.setState({ toggle });
    } else {
      this.setState({ toggle: false });
    }
  }

  setEventBus(modeler) {
    this.eventBus = modeler.get('eventBus');
  }

  rememberToggleStateForTab(tabId) {
    const tabState = this.tabStates.get(tabId);
    if (tabState) {
      tabState.toggle = this.state.toggle;
    }
  }

  toggle() {
    const toggle = !this.state.toggle
    this.setState({ toggle });
    this.eventBus.fire('flowDataPlugin.toggle', { toggle });
  }

  render() {
    return (
      <Fragment>
        <Fill slot="status-bar__file">
          <label htmlFor='flow-data-plugin-toggle' className='pluggin-toggle'>
            <input type='checkbox' id='flow-data-plugin-toggle' checked={this.state.toggle} onChange={() => this.toggle()} />
            View IO
          </label>
        </Fill>
      </Fragment>
    )
  }
}