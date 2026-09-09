import { Component } from 'react';
import { Outlet } from 'react-router-dom';

/**
 * Error boundary that wraps the extension route subtree. A throwing extension
 * page renders a small inline alert instead of blanking the navbar or the
 * stock pages. Used as a layout route, so it renders an `<Outlet />` while
 * healthy.
 */
class ExtensionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.warn('[extensions] route component threw', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-warning">This extension page failed to load.</div>
      );
    }

    return this.props.children ?? <Outlet />;
  }
}

export default ExtensionErrorBoundary;
