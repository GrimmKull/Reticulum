# Portal

 * show licence details
 * for **Nihad** if account is admin_portal and brand
 * license and user database read access
 * configurable queue for sending email and stats
 * send email to all accounts for that brand with info for new app version release (RC)
 * if in 1 month no RC found in Counter send email to Denis
 * if Counter gets more than 100 RC installs RC goes to stable
 * in licenses view search licenses, on edit option to enable RC updates
 * in versions view on edit add licenses with enabled RC updates and show the list of all enabled
 * show number of installations for that version from Counter

## Admin

 * versions view needs tabs that will show releases for each brand
 * no brand view
 * add filter by brand

## Procedure

 * Admin uploads version
 * version is RC
 * send email notification to relevant contacts

 * portal counts RC downloads if count > 100 is stable
 * if count 0 after more than 15 days resent email

 * resellers and admin can set RC to stable
 * if gloCOM or Communicator only admin can set RC to stable
 * option to disable version to skip it on updates

## Client Procedure
 * first compare PBX and client first version number if same send has update or no update
 * if different send has update but PBXware not compatible

## Dashboard

 * pie charts for Counter info for their licenses

## Senad suggestions

 * [ ] Testing extensions admininstration on PBXware to be used to check for test and RC updates support on extension by extension basis
 * [x] Add a link with original documentation and help
 * [ ] Support for tracking user actions in portal to find out who made changes and mistakes
 * [ ] crash report notification for not supported versions of gloCOM ???
 * [ ] configurable ip login constraints

Customers => Partners  
Admin => Bicom
