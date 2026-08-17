import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        this.props.fallback || (
          <div className="meet-fallback">
            <h2>The class room could not open.</h2>
            <p>{String(this.state.error.message || this.state.error)}</p>
            {this.props.onReset ? (
              <button className="button portal-button" type="button" onClick={() => {
                this.setState({ error: null });
                this.props.onReset();
              }}>
                Back to classes
              </button>
            ) : null}
          </div>
        )
      );
    }
    return this.props.children;
  }
}
