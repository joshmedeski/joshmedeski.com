import clsx from "clsx";
import type { FunctionalComponent } from "preact";

const PdeCta: FunctionalComponent = () => {
  return (
    <div class="bg-indigo-50">
      <section className="min-h-[60vh] flex flex-col justify-center py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              <span className="md:block">Boost productivity with a </span>
              <span className="md:block font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                personal development environment
              </span>
            </h1>
            <p className="mt-3 text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl max-w-[630px] mx-auto">
              It's time to ditch your clunky editor for a <strong>terminal-based workflow</strong> that will help you become a <strong>better developer</strong> and get more done, faster.
            </p>
            <a href="/courses/pde" class={clsx([
              "rounded-lg tracking-wider inline-block font-bold",
              "text-white px-6 py-4 mt-6 text-2xl",
              "bg-gradient-to-l from-indigo-500 to-purple-600",
              "shadow-lg hover:shadow-xl",
              "hover:from-indigo-700 hover:to-purple-800",
              "ease-in-out duration-300 transition-all"
            ])}>
              Get Started <span class="font-light text-slate-300">-</span><span class="font-light text-slate-100"> for Free</span>
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-screen-xl px-4">
        <div className={clsx([
          "border-[#999999] border-2 border-b-0 bg-black p-2 lg:p-4 pb-0 lg:pb-0",
          "rounded-t-2xl",
        ])} >
          <img
            className="rounded-t-lg w-full h-auto"
            src="/images/pde-screenshot.jpg"
            alt="App screenshot"
          />
        </div>
      </section>
    </div>
  )
};

export default PdeCta;
