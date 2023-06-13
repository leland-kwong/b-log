# Macbooks are still king for software development

Around three years ago I had bought a top-of-the-line Razer Blade laptop that I thought would be the best of both worlds: a great gaming and dev machine. Initially, Microsoft's WSL felt pretty good, and for awhile I thought it could potentially replace Macos.

Fast forward three years later and I'm now back on the Macbook train for a number of reasons.

## WSL is amazing

I want to first begin by acknowledging the remarkable engineering effort Microsoft did to pull of running a native linux subsystem alongside the Windows operating system. The performance is generally very good, and for the first time in decades you can actually work in the terminal using all the powerful unix command line tools.

Its also important to recognize that the vast majority of the world uses Windows simply because Apple products are at a luxury price point.

## WSL also has many caveats

One of WSL's biggest drawbacks is it runs in a sandboxed environment separate from the Windows operating system. As a result, you'll encounter inconvenient quirks such as:

* Localhost in WSL not exposed as localhost to the browser. This makes it terribly inconvenient for web development. There are [solutions](https://stackoverflow.com/questions/64763147/access-a-localhost-running-in-windows-from-inside-wsl2), but it isn't very convenient.
* Accessing files between Windows and WSL is incredibly slow, and you often run into random file permission issues.

Clearly I'm not alone with all the frustrations as you'll see in this [article](https://medium.com/for-linux-users/wsl-2-why-you-should-use-real-linux-instead-4ee14364c18).

## Macos just works
