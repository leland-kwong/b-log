# Macbooks are still king for software development

Around three years ago I had bought a top-of-the-line Razer Blade laptop that I thought would be the best of both worlds: a great gaming and dev machine. Initially, Microsoft's WSL felt pretty good, and for awhile I thought it could potentially replace Macos.

Fast forward three years later and I'm now back on the Macbook train for a number of reasons.

## The quirks of WSL

One of WSL's biggest drawbacks is it runs in a sandboxed environment separate from the Windows operating system. As a result, you'll encounter quirks such as:

* Localhost in WSL not exposed as localhost to the browser. This makes it terribly inconvenient for web development. There are [solutions](https://stackoverflow.com/questions/64763147/access-a-localhost-running-in-windows-from-inside-wsl2), but it isn't very convenient.
* Accessing files between Windows and WSL is incredibly slow, and you can run into strange [file system issues](https://github.com/pyenv/pyenv/issues/1725).
* Most of the documentation out there assumes you're either on a Mac or linux machine. So whenever you run into one WSL's obscure error messages, you're left scratching your head and googling for an answer.

Clearly I'm not alone with all the frustrations as you'll see in this [article](https://medium.com/for-linux-users/wsl-2-why-you-should-use-real-linux-instead-4ee14364c18).

## Latest Macbook hardware is chefs kiss

With the recent release of [Apple Silicon](https://appleinsider.com/inside/apple-silicon), the battery life and performance has improved dramatically. Its not uncommon to get 8 hours of usage on a single charge, and the fans rarely ever kick off, all while your compile times and scripts run buttery smooth and quick. It is night and day with how smooth the development experience is compared to Windows.

## WSL is still amazing

All this to say that Microsoft still did a remarkable engineering effort to pull of running a native linux subsystem alongside the Windows operating system. The performance is generally very good, and for the first time in decades you can actually work in the terminal using all the powerful unix command line tools.

