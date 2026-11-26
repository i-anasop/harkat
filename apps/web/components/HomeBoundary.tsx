"use client";

import { Component, type ReactNode } from "react";
import s from "./HomeBoundary.module.css";

type Props = { children: ReactNode };
type State = { error: Error | null };

/** Catches a render crash on the prompt page and offers a way back, including a damaged saved list. */
export default class HomeBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  retry = () => this.setState({ error: null });

  clear = () => {
    try { localStorage.removeItem("harkat.promptHistory"); } catch { /* private mode */ }
    this.setState({ error: null });
  };

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className={s.wrap} role="alert">
        <h1>This page hit a snag.</h1>
        <p>Nothing was sent. You can try again, or clear the films saved in this browser if one of them is damaged.</p>
        <div className={s.row}>
          <button type="button" className={s.primary} onClick={this.retry}>Try again</button>
          <button type="button" className={s.ghost} onClick={this.clear}>Clear saved films</button>
        </div>
      </div>
    );
  }
}
