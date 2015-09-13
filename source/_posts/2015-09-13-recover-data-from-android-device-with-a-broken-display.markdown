---
layout: post
title: "How to recover data from an android device with a broken display"
date: 2015-09-13 19:25:20 +0530
comments: true
categories: [Android, Samsung, Galaxy Note II, Recover Data]
---

Yesterday, I accidently dropped my Samsung Galaxy Note II and it's display broke.
It's a 3 year old device on which I didn't want to spend another penny, so I wasn't
sad but worried about my data in the Internal Storage of the phone.
The screen was completely dead, even the touch was not working.

The main problem was that the Pattern lock was enabled, due to which I wasn't
able to connect the phone in
[MTP](https://en.wikipedia.org/wiki/Media_Transfer_Protocol "Media Transfer Protocol")
mode, and [ADB](http://developer.android.com/tools/help/adb.html "Android Debug Bridge")
showed the device as `unauthorized`.
At this point I was wondering why I didn't backup everything before, it was frustrating.

After hours of searching through the web, I found a few solutions, but none of them
were helpful as

* My phone was locked.
* USB Debugging was disabled.

Then, I found this tool on XDA called
[ADB Data Recovery](http://forum.xda-developers.com/showthread.php?t=2339530 "ADB Data Recovery")
by [FuzzyMeep Two](http://forum.xda-developers.com/member.php?u=4507027 "XDA user FuzzyMeep Two").
Sadly, it was a tool for Windows and I had a Linux and a Mac machine.
Luckily, I found what the tool actually does by going through the thread.
The tool uses the command `adb pull` to fetch data from the phone's storage.
But, for that to work you need to have a `Custom Recovery` installed on your phone, which
in my case was already there.
So, it turned out to be very easy for people who usually install Custom ROMs on
their Android devices.

* Boot your phone into recovery mode.
* Connect your phone to the computer via USB.
  * Check if your phone is connected properly using `adb devices`.
  * You will see a unique ID of your phone and the text `recovery` after it.
* Now to backup your data use the `adb pull` command:
    ``adb push <source-path> <target-path>``

I found this nice [article](http://www.droidviews.com/push-pull-files-android-using-adb-commands/ "adb pull")
explaining the use case of `adb pull` command.

So, to sum it all up, if you can somehow install custom recovery on your phone,
you can save all your shit.

PS: Screenshots coming soon.

