import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

// 全站错误边界：捕获渲染期异常，避免整页白屏
// 注：本项目未安装 @types/react，这里显式声明 state/props 以保证类型可用
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };
  declare props: ErrorBoundaryProps;

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('页面渲染出错:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env?.DEV;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fcf9e8] px-6 text-center">
        <div className="text-6xl mb-4">😢</div>
        <h1 className="text-2xl font-black text-green-950">哎呀，出了点小问题</h1>
        <p className="mt-2 text-sm font-medium text-gray-500">我们已经记录了这个问题</p>

        {isDev && this.state.error && (
          <pre className="mt-4 max-w-xl overflow-auto rounded-xl bg-red-50 p-4 text-left text-xs text-red-500">
            {this.state.error.message}
          </pre>
        )}

        <div className="mt-8 flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 gradient-ningyuzhi text-green-950 font-black rounded-2xl hover:scale-[1.03] transition-transform"
          >
            刷新页面
          </button>
          <button
            onClick={() => {
              window.location.hash = '#/';
              window.location.reload();
            }}
            className="px-6 py-3 bg-white border-2 border-green-200 text-green-700 font-black rounded-2xl hover:bg-green-50 transition-colors"
          >
            返回首页
          </button>
        </div>
      </div>
    );
  }
}
