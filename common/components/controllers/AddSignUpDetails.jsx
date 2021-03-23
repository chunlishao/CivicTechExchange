// @flow

import DjangoCSRFToken from "django-react-csrftoken";
import React from "react";
import type { Validator } from "../forms/FormValidation.jsx";
import FormValidation from "../forms/FormValidation.jsx";
import _ from "lodash";
import SocialMediaSignupSection from "../common/integrations/SocialMediaSignupSection.jsx";

type State = {|
  service: string,
  firstName: string,
  lastName: string,
  validations: $ReadOnlyArray<Validator>,
  isValid: boolean,
|};

class AddSignUpDetails extends React.Component<{||}, State> {
  constructor(): void {
    super();

    this.state = {
      service: "[TODO: Insert Service Here]",
      firstName: "",
      lastName: "",
      isValid: false,
      validations: [
        {
          checkFunc: (state: State) => !_.isEmpty(state.firstName),
          errorMessage: "Please enter First Name",
        },
        {
          checkFunc: (state: State) => !_.isEmpty(state.lastName),
          errorMessage: "Please enter Last Name",
        },
      ],
    };
  }

  onValidationCheck(isValid: boolean): void {
    if (isValid !== this.state.isValid) {
      this.setState({ isValid });
    }
  }

  render(): React$Node {
    return (
      <React.Fragment>
        <div className="LogInController-root">
          <div className="LogInController-greeting">
            <p>
              We were not able to obtain your full name from{" "}
              {this.state.service}.
            </p>
            <p>Please update the missing information.</p>
          </div>
          <form action="/api/signup/add/" method="post">
            <DjangoCSRFToken />
            <div>First Name:</div>
            <div>
              <input
                className="LogInController-input"
                name="first_name"
                onChange={e => this.setState({ firstName: e.target.value })}
                type="text"
              />
            </div>
            <div>Last Name:</div>
            <div>
              <input
                className="LogInController-input"
                name="last_name"
                onChange={e => this.setState({ lastName: e.target.value })}
                type="text"
              />
            </div>

            <FormValidation
              validations={this.state.validations}
              onValidationCheck={this.onValidationCheck.bind(this)}
              formState={this.state}
            />

            <button
              className="LogInController-signInButton"
              disabled={!this.state.isValid}
              type="submit"
            >
              Create Account
            </button>
          </form>
          <div className="SignUpController-socialSection">
            <SocialMediaSignupSection />
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default AddSignUpDetails;
