import FindProjectsController  from './FindProjectsController.jsx'
import LandingController from './LandingController.jsx'
import React from 'react';
import Section from '../enums/Section.js'

class SectionController extends React.Component {
  render() {
    return (
      <div>
        {this._getController()}
      </div>
    );
  }

  _getController() {
    switch (this.props.section) {
      case Section.Landing:
        return <LandingController />;
      case Section.FindProjects:
        return <FindProjectsController />;
      default:
        return <div>Unknown section: {this.props.section}</div>
    }
  }
}

export default SectionController;