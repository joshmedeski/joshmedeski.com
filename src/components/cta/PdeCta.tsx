import clsx from 'clsx'
import type { FunctionalComponent } from 'preact'

const PdeCta: FunctionalComponent = () => {
  return (
    <div class="bg-indigo-50">
      <section className="flex min-h-[60vh] flex-col justify-center py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              <span className="md:block">Boost productivity with a </span>
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text font-extrabold text-transparent md:block">
                personal development environment
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-[630px] text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl">
              It's time to ditch your clunky editor for a{' '}
              <strong>terminal-based workflow</strong> that will help you become
              a <strong>better developer</strong> and{' '}
              <strong>get more done</strong>, faster.
            </p>
            <a
              href="/guides/dev-workflow-intro"
              class={clsx([
                'inline-block rounded-lg font-bold tracking-wider',
                'mt-6 px-6 py-4 text-2xl text-white',
                'bg-gradient-to-l from-indigo-500 to-purple-600',
                'shadow-lg hover:shadow-xl',
                'hover:from-indigo-700 hover:to-purple-800',
                'transition-all duration-300 ease-in-out',
              ])}
            >
              Learn More <span class="font-light text-slate-300">-</span>
              <span class="font-light text-slate-100">
                {' '}
                Coming July 14th, 2023
              </span>
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-screen-xl px-4">
        <div
          className={clsx([
            'border-2 border-b-0 border-[#999999] bg-black p-2 pb-0 lg:p-4 lg:pb-0',
            'rounded-t-2xl',
          ])}
        >
          <img
            className="h-auto w-full rounded-t-lg"
            src="../../assets/pde-screenshot.jpg"
            alt="App screenshot"
          />
        </div>
      </section>
    </div>
  )
}

export default PdeCta
