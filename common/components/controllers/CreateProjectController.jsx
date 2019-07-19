// @flow

import React from "react";
import {Button} from 'react-bootstrap';
import CurrentUser from "../../components/utils/CurrentUser.js";
import VerifyEmailBlurb from "../common/notification/VerifyEmailBlurb.jsx";
import ConfirmationModal from "../common/confirmation/ConfirmationModal.jsx";
import metrics from "../utils/metrics.js";
import LogInController from "./LogInController.jsx";
import Section from "../enums/Section.js";
import Headers from "../common/Headers.jsx";
import ProjectOverviewForm from "../componentsBySection/CreateProject/ProjectOverviewForm.jsx";
import ProjectInfoForm from "../componentsBySection/CreateProject/ProjectInfoForm.jsx";
import ProjectPreviewForm from "../componentsBySection/CreateProject/ProjectPreviewForm.jsx";
import ProjectDescriptionForm from "../componentsBySection/CreateProject/ProjectDescriptionForm.jsx";
import ProjectPositionsForm from "../componentsBySection/CreateProject/ProjectPositionsForm.jsx";
import ProjectResourcesForm from "../componentsBySection/CreateProject/ProjectResourcesForm.jsx";
import ProjectAPIUtils, {ProjectDetailsAPIData} from "../utils/ProjectAPIUtils.js";
import LoadingMessage from "../chrome/LoadingMessage.jsx";
import api from "../utils/api.js";
import url from "../utils/url.js";

type CreateProjectStepConfig = {|
  header: string,
  subHeader: string,
  formComponent: React$Node,
  prerequisites: (ProjectDetailsAPIData) => boolean
|};

// TODO: Use prerequisites or get rid of them
const steps: $ReadOnlyArray<CreateProjectStepConfig> = [
  {
    header: "Let's get started!",
    subHeader: "Tell us how you want to create a better world.",
    formComponent: ProjectOverviewForm,
    prerequisites: (project: ProjectDetailsAPIData) => true
  }, {
    header: "Let others know what your project is about...",
    subHeader: "You can always change details about your project later.",
    formComponent: ProjectInfoForm,
    prerequisites: (project: ProjectDetailsAPIData) => project.project_name
  }, {
    header: "Let others know what your project is about...",
    subHeader: "You can always change details about your project later.",
    formComponent: ProjectDescriptionForm,
    prerequisites: (project: ProjectDetailsAPIData) => project.project_name
  }, {
    header: "What resources would you like to share?",
    subHeader: "Let volunteers know how they can engage with your project",
    formComponent: ProjectResourcesForm,
    prerequisites: (project: ProjectDetailsAPIData) => project.project_name
  }, {
    header: "What type of volunteers does your project need?",
    subHeader: "You can always change the type of help your project needs later.",
    formComponent: ProjectPositionsForm,
    prerequisites: (project: ProjectDetailsAPIData) => project.project_name
  }, {
    header: "Ready to publish your project?",
    subHeader: "Congratulations!  You have successfully created a tech-for-good project.",
    formComponent: ProjectPreviewForm,
    prerequisites: (project: ProjectDetailsAPIData) => !!project
  }
];


type State = {|
  projectId: number,
  project: ?ProjectDetailsAPIData,
  projectIsLoading: boolean,
  currentStep: number,
  formIsValid: boolean,
  fieldsUpdated: boolean,
  showConfirmDiscardChanges: boolean,
  navigateToStepUponDiscardConfirmation: number,
  beforeSubmit: Function
|};

/**
 * Encapsulates form for creating projects
 */
class CreateProjectController extends React.PureComponent<{||},State> {
  constructor(props: {||}): void {
    
    super(props);
    // TODO: Support navigating to page via &step=#
    // TODO: Support auto-navigating to page via prerequisites
    const projectId: number = url.argument("id");
    this.formRef = React.createRef();
    this.state = {
      projectId: projectId,
      projectIsLoading: !!projectId,
      currentStep: 0,
      formIsValid: false,
      fieldsUpdated: false,
      showConfirmDiscardChanges: false
    };
  }
  
  navigateToStep(step: number): void {
    if(this.state.fieldsUpdated) {
      this.setState({
        navigateToStepUponDiscardConfirmation: step,
        showConfirmDiscardChanges: true
      });
    } else {
      this.setState(Object.assign(this.resetPageState(), {
        currentStep: step
      }));
      this.forceUpdate();
    }
  }
  
  componentDidMount(): void {
    if(this.state.projectId) {
      ProjectAPIUtils.fetchProjectDetails(this.state.projectId, this.loadProjectDetails.bind(this), this.handleLoadProjectError.bind(this));
    }
    if(CurrentUser.isLoggedIn() && CurrentUser.isEmailVerified()) {
      // TODO: Only fire event on initial page when the project is not yet created
      // metrics.logProjectClickCreate(CurrentUser.userID());
    }
  }
  
  resetPageState(state: ?State): State {
    let _state: State = state || this.state;
    return Object.assign(_state, {
      beforeSubmit: null,
      fieldsUpdated: false
    });
  }
  
  loadProjectDetails(project: ProjectDetailsAPIData): void {
    if(!CurrentUser.isOwner(project)) {
      // TODO: Handle someone other than owner
    } else {
      this.setState({
        project: project,
        projectIsLoading: false
      });
    }
  }
  
  handleLoadProjectError(error: APIError): void {
    this.setState({
      error: "Failed to load project information"
    });
  }
  
  onValidationCheck(formIsValid: boolean, beforeSubmit: ?Function): void {
    if (formIsValid !== this.state.formIsValid) {
      this.setState({formIsValid});
    }
  
    if (beforeSubmit !== this.state.beforeSubmit) {
      this.setState({beforeSubmit});
    }
  }
  
  onSubmit(event: SyntheticEvent<HTMLFormElement>): void {
    const formSubmitUrl: string = this.state.project && this.state.project.project_id
      ? "/projects/edit/" + this.state.project.project_id + "/"
      : "/projects/signup/";
    const submitFunc: Function = () => {
      api.postForm(formSubmitUrl, this.formRef, this.onSubmitSuccess.bind(this), response => null /* TODO: Report error to user */);
    };
    this.state.beforeSubmit ? this.state.beforeSubmit(submitFunc) : submitFunc();
    event.preventDefault();
  }
  
  onFormUpdate(formFields: {||}) {
    this.setState({fieldsUpdated: true});
  }
  
  confirmDiscardChanges(confirmDiscard: boolean): void {
    let confirmState: State = this.state;
    confirmState.showConfirmDiscardChanges = false;
    if(confirmDiscard) {
      confirmState.currentStep = this.state.navigateToStepUponDiscardConfirmation;
      confirmState = this.resetPageState(confirmState);
    }
    
    this.setState(confirmState);
    this.forceUpdate();
  }
  
  onSubmitSuccess(project: ProjectDetailsAPIData) {
    
    if(this.onLastStep()) {
      metrics.logProjectCreated(CurrentUser.userID());
      // TODO: Your project "' + project.project_name + '" is awaiting approval.  Expect a decision in the next business day.
      // TODO: Fix bug with switching to this section without page reload
      window.location.href = url.section(Section.MyProjects);
    } else {
      this.setState(Object.assign(this.resetPageState(), {
        project: project,
        currentStep: this.state.currentStep + 1
      }));
      this.forceUpdate();
    }
  }
  
  render(): React$Node {
    return (
      <React.Fragment>
        <Headers
          title="Create a Project | DemocracyLab"
          description="Create project page"
        />
        {!CurrentUser.isLoggedIn()
          ? <LogInController prevPage={Section.CreateProject}/>
          : <React.Fragment>
              {CurrentUser.isEmailVerified() ? this._renderCreateProjectForm() : <VerifyEmailBlurb/>}
            </React.Fragment>
        }
      </React.Fragment>
    );
  }
  
  _renderCreateProjectForm() : React$Node {
    const currentStep: CreateProjectStepConfig = steps[this.state.currentStep];
    
    return (
      <React.Fragment>
        <ConfirmationModal
          showModal={this.state.showConfirmDiscardChanges}
          message="You have unsaved changes on this form.  Do you want to discard these changes?"
          onSelection={this.confirmDiscardChanges.bind(this)}
        />
        
        
        <div className="create-form white-bg">
          <h1>{currentStep.header}</h1>
          <h2>{currentStep.subHeader}</h2>
          {/*TODO: Render step bars*/}
        </div>
  
        {this.state.projectIsLoading ? <LoadingMessage /> : this._renderForm()}

      </React.Fragment>
    );
  }
  
  _renderForm(): React$Node {
    const FormComponent: React$Node = steps[this.state.currentStep].formComponent;
  
    return (
      <form
        onSubmit={this.onSubmit.bind(this)}
        method="post"
        ref={this.formRef}>
    
        <div className="create-form grey-bg">
          <FormComponent
            project={this.state.project}
            readyForSubmit={this.onValidationCheck.bind(this)}
            onFormUpdate={this.onFormUpdate.bind(this)}
          />
        </div>
    
        <div className="create-form white-bg">
          {/*TODO: Bring button visuals in line with design*/}
      
          <Button className="btn btn-theme"
                  type="button"
                  title="Back"
                  disabled={this.state.currentStep === 0}
                  onClick={this.navigateToStep.bind(this, this.state.currentStep - 1)}
          >
            Back
          </Button>
      
          {/*TODO: Project Saved icon*/}
      
          <div className="form-group pull-right">
            <div className='text-right'>
              <input type="submit" className="btn_outline save_btn"
                     disabled={!this.state.formIsValid}
                     value={this.onLastStep() ? "PUBLISH" : "Next"}
              />
            </div>
          </div>
        </div>
      </form>
    );
  }
  
  onLastStep(): boolean {
    return this.state.currentStep >= steps.length - 1;
  }
}

export default CreateProjectController;
