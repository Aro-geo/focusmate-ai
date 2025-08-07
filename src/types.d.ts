// Type declarations for modules that might be missing type definitions
declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}
declare module 'react-dom' {
  import * as ReactDOM from 'react-dom';
  export = ReactDOM;
  export as namespace ReactDOM;
}
declare module 'react-router-dom';

// Additional React type fixes
declare global {
  namespace React {
    type FC<P = {}> = FunctionComponent<P>;
    interface FunctionComponent<P = {}> {
      (props: P, context?: any): ReactElement<any, any> | null;
      propTypes?: WeakValidationMap<P> | undefined;
      contextTypes?: ValidationMap<any> | undefined;
      defaultProps?: Partial<P> | undefined;
      displayName?: string | undefined;
    }
    type ReactNode = ReactChild | ReactFragment | ReactPortal | boolean | null | undefined;
    type ReactElement<P = any, T extends string | JSXElementConstructor<any> = string | JSXElementConstructor<any>> = any;
    type ReactChild = ReactElement | ReactText;
    type ReactText = string | number;
    type ReactFragment = {} | ReactNodeArray;
    interface ReactNodeArray extends Array<ReactNode> {}
    type ReactPortal = any;
    type JSXElementConstructor<P> = any;
    type WeakValidationMap<T> = any;
    type ValidationMap<T> = any;
    type ChangeEvent<T = Element> = any;
    type FormEvent<T = Element> = any;
    function useRef<T>(initialValue: T): any;
    function useState<S>(initialState: S | (() => S)): [S, any];
    function useEffect(effect: any, deps?: any[]): void;
    function useContext<T>(context: any): T;
    function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
    function createContext<T>(defaultValue: T): any;
  }
}
