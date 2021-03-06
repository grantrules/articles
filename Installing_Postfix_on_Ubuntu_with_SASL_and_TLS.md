---
title: Installing and Securing Postfix on Ubuntu 17.10
template: article
shortdesc: A fairly comprehensive guide to installing Postfix on Ubuntu and setting up modern spam prevention tools that aid in secure delivery, including TLS encryption, PAM authentication, and SPF, DKIM, and DMARC records
---
>**''The Postfix security model is based on keeping software simple and stupid.''**
> -- Wietse Venema, author of Postfix

Postfix is an incredibly powerful mailserver which Ubuntu makes a breeze to get running. Unfortunately spam is a major problem with running a mailserver. A mailserver can be run as open or as closed as you want. An open server can allow an anonymous user to send email from any email address to any email address. To deliver mail to a Gmail inbox, it needs to be secure. This article will walk through installing Postfix, enabling PAM user authentication with Cyrus SASL, requiring TLS session encryption with Let's Encrypt certificates, and implementing SPF, DKIM, and DMARC rules.

## Table of Contents

[[TOC]]

## Why?
In the age of cloud computing and APIs, why would you want to run your own mailserver when you can just pay a professional service to deliver those emails for you? Well first, it's free. There's no trial period, user limits, or restrictions, and it's very reliable. It's pretty easy to get a mailserver up and running for your development environment, but if you want someone to be able to receive those emails without checking their spam folder, it requires configuration. This is also a great way to become familiar with a Linux system.


## Let's Get Started
We will be focusing on setting up Postfix for sending emails only. Cyrus provides an IMAP server that is fairly easy to set up, but for the purposes of this article, we'll be forwarding all received email to a Gmail address.

> **What you need before starting this article**
>
> - Ubuntu 17.10 installation
> - A domain name and control over its DNS records

Take for instance sending mail through the postal service. You can write a letter and put a fake return name and address on it. You can write a return address from Alaska and drop it in a box in Florida and it will be received. Postfix, by default will send any email with whatever "from" address the sender decides to put. It may not be an email address the sender has any control over, which is called origin fraud or spoofing. Obviously mail clients want to limit this, once spoofed emails are delivered, they can be fairly hard to detect for a user (without digging into the email headers).

If I were to try to send an email through Gmail addressed from billgates@microsoft.com it wouldn't let me.

In order for email to be delivered, the mail server needs to trust the author of the email and the mail client needs to trust the mail server.

The mail server will use user authentication to verify the sender.

The mail client will use a variety of tools to verify the mailserver is authorized to send email for the author's domain. The tools are SPF, DKIM, and DMARC and there's an explanation of them here: https://www.endpoint.com/blog/2014/04/15/spf-dkim-and-dmarc-brief-explanation

Briefly, they're DNS record entries for a domain that tell mail clients where emails will be originating from and what the allowed mail servers are.



----------


Installing Postfix
-------------

Simply open up a console and run

    sudo apt install postfix

At the prompt *General type of mail configuration*, choose *Internet site* and enter your domain name on the following screen under *System mail name*.

Once it's installed, confirm that the Postfix service is running with this command:

    service postfix status

Another way to verify Postfix is running is to connect to the server with telnet on port 25

    $ telnet localhost 25
    Connected to localhost
    Escape character is '^]'
    220 ubuntu ESMTP Postfix (Ubuntu)
    >

Once connected, issue the EHLO command to get a response from the server

     EHLO grantrules.com
    
The server should respond with a list of commands available, this just confirms the server is responding and is ready to receive email. Enter *quit* to exit the telnet session.

> **:bulb: Note:** After making any change in the Postfix config, reload the config with this command
> 
> `sudo service postfix reload`


By default, Postfix in Ubuntu is configured to run within a chroot environment. This is changes the root directory to a path other than /, in the case of Postfix that is /var/spool/postfix/, so anything outside that directory is not accessible or visible from within the chroot. For added security, we'll make sure that all services we'll be setting up for Postfix run in this chroot as well.


## Creating virtual mailboxes

This server is just for intended sending emails from services. There are robust IMAP services like Cyrus and Dovecot, but for our purposes, we just want to forward everything that a domain receives to one Gmail address.

>**Create virtual alias file**
>
>`sudo vi /etc/postfix/virtual`
>
>Add the line:
>```
>@grantrules.com youremail@gmail.com

After saving the file, use *postmap* to update Postfix's internal lookup tables

`sudo postmap /etc/postfix/virtual`

Now we'll configure Postfix to use those virtual aliases

> **Add virtual alias to main.cf**
> 
>`sudo vi /etc/postfix/main.cf`
>
>Add the lines:
>
>```
>virtual_alias_domains = $mydomain
>virtual_alias_maps = hash:/etc/postfix/virtual
>disable_vrfy_command = yes

Remember to reload the config with

`sudo service postfix reload`

----------


User Authentication with PAM + Cyrus SASL
-------------

The first thing to do once Postfix is running is to prevent people from anonymously sending mail. SASL is the standard that Postfix will use to provide user authentication. There are two SASL implementations that are supported by Postfix on Ubuntu by default, Dovecot and Cyrus. I will be setting up Cyrus SASL and configuring PAM to use a userdatabase in this section. PAM (Pluggable Authentication Modules) provides dynamic authentication support for Linux systems.

First, PAM needs to be set up to handle SMTP authorization requests

> **Create SMTP module for PAM**
>
> `sudo vi /etc/pam.d/smtp`
>
> Add these lines:
> ```
> auth    required   pam_userdb.so db=/etc/postfix/users crypt=crypt
> account sufficient pam_userdb.so db=/etc/postfix/users crypt=crypt

Confusingly, PAM will be looking for /etc/postfix/users.db

To create this file, we need to create a Berkeley database and add a user. 

     { echo user; echo `mkpasswd -s -m sha-512`; } | sudo db_load -T -t hash /etc/postfix/users.db

Make sure to replace *user* with the username you want. You will be prompted for a password for the user.

> **:bulb: Note:** If mkpasswd does not exist on your system, you can install it with `sudo apt install whois` and if you're wondering why mkpasswd is in the whois package, [the answer is here](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=116260)

> **:bulb: Note:** PAM can be configured to authenticate against Unix accounts, database servers, and more

Once the database is set up, we'll go ahead and install Cyrus SASL.

> **Install Cyrus SASL**
> 
> `sudo apt install sasl2-bin`

> **Add saslauthd user to postfix usergroup**
> 
> `sudo adduser postfix sasl`

> **Create directory for sock file**
> ```
> sudo mkdir -p /var/spool/postfix/var/run/saslauthd
> sudo chown sasl:postfix /var/spool/postfix/var/run/saslauthd

Confirm the sasl service is running with the service command again

`service saslauthd status`
 
saslauthd is not a Postfix-specific service, but that's all we're going to be using it for, so we need to edit the configuration to run within Postfix's chroot. Typically, defaults files should not be edited, but there is no other way to change where the sock file is located due to the design of this particular service.

> **Edit SASL service config**
>
> `sudo vi /etc/default/saslauthd`
> 
> Update the OPTIONS setting as follows
>
> `OPTIONS="-c -m /var/spool/postfix/var/run/saslauthd"`

Finally, restart the saslauthd service

    sudo service saslauthd restart

> **:bulb: Note:** If you use saslauthd for anything else, you can just copy /etc/default/saslauthd to /etc/default/postfix-saslauthd ane make the above changes to the new file.

Once we've configured SASL, we will add it to our Postfix config, first by creating a smtpd.conf file for SASL then updating our main.cf
 
>**Create SASL smtpd config**
>
>`sudo vi /etc/postfix/sasl/smtpd.conf`
>
>add these lines:
>
>```
>saslauthd_path: /var/run/saslauthd/mux
>pwcheck_method: saslauthd
>mech_list: PLAIN LOGIN

Once SASL is configured, set up Postfix to rely on it.

> **Configure Postfix to use SASL**
> 
> `sudo vi /etc/postfix/main.cf`
> 
> add these lines:
> 
> ```
> smtpd_sasl_path = smtpd
> smtpd_sasl_local_domain =
> smtpd_sasl_auth_enable = yes
> smtpd_sasl_security_options = noanonymous
> broken_sasl_auth_clients = yes
> smtpd_recipient_restrictions = permit_sasl_authenticated,permit_mynetworks,reject_unauth_destination
> inet_interfaces = all


----------


End-to-end Encryption with TLS
-------------

Transport Layer Security provides session encryption for Postfix. To implement this, we will be generating certificates using Lets Encrypt, a free, automated certificate authority run by a non-profit.

>**Install Lets Encrypt and generate certificates**
>
>```sudo apt install letsencrypt
>sudo letsencrypt certonly --standalone -d mail.grantrules.com

>**Enable TLS in Postfix**
>
> `sudo vi /etc/postfix/main.cf`
> 
> Add these lines:
>
> ```
> smtpd_tls_cert_file=/etc/letsencrypt/live/mail.grantrules.com/fullchain.pem
> smtpd_tls_key_file=/etc/letsencrypt/live/mail.grantrules.com/privkey.pem
> smtpd_use_tls=yes
> smtpd_tls_session_cache_database = btree:${data_directory}/smtpd_scache
> smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
> smtpd_tls_security_level = may
> smtp_tls_security_level = may
> smtpd_tls_auth_only = yes
> ```





----------


SPF, DKIM, DMARC: Configuring DNS records
-------------

SPF, DKIM, and DMARC are all open standards to help prevent sender fraud. These tools allow the domain owner to set up rules to who should be allowed to send email from their domain and through which servers. 

### SPF: Sender Policy Framework

Sender Policy Framework is simply a TXT record in your DNS that specifies a list of servers or IP ranges allowed to send email through from your domain. When the receiving mailserver gets an email from you, it will check the DNS record for and SPF record, and try to match the sender's IP to any of the rules and then issue a pass or fail.

>**Example of SPF DNS record**
> ` grantrules.com. IN TXT "v=spf1 ip4:192.168.0.0/16 a:friendlycorp.com -all"`

In the example, we define the version as *spf1* and then add 3 directives: *ip4:192.168.0.0/16*, *a:friendlycorp.com*, *-all*

Directives involve a mechanism (ip4, a, all) and are prefixed by a qualifier (+, -, ~, ?). If no qualifier is present, + is implied. So *ip4:192.168.1.1* is the same as *+ip4:192.168.1.1*.

>**SPF qualifiers**
>| Qualifier | Description |
>| ------ | ----------- |
>| +   | Pass |
>| - | Fail |
>| ?    | Neutral, like there has been no check |
>| ~ | Softfail, typically messages are accepted but tagged |

The first directive, *ip4:192.168.0.0/16*, defines an IPv4 address range that are authorized to send emails through your server. It can be a single IP address or a range in CIDR notation. In this example, it allows all IP addresses on our subnet, from 192.168.0.0 to 192.168.255.255, good if you want anyone on your local network to be able to send emails through your server.

The second directive, *a:friendlycorp.com*, allows email to be sent if any A, AA, AAA, or AAAA record of friendlycorp.com resolves to the sender's IP address. This is useful if you have a third-party service that wants to send email.

The final directive, *-all*, specifies if no previous rule matched the sender's IP address, the message should be rejected.

This should be customized to suit your specific needs. You may not want to let your entire subnet be allowed to send emails, or you may want to send emails from outside your network.

Other common directives include *mx* which matches IP addresses in MX records, *ip6* which matches IPv6 ranges, and *ptr* which matches PTR records.

### DKIM: DomainKeys Identified Mail
DKIM uses public key encryption to allow the recipient to verify your mailserver is authorized to send mail through your domain. To do this, we need to install opendkim

    sudo apt install opendkim opendkim-tools

### DMARC: Domain-based Message Authentication, Reporting, and Conformance

DMARC works with both SPF and DKIM and provides a way for receiving mailservers to report to an email specified by the sending domain.

> **Example of DMARC DNS record**
> `_dmarc.grantrules.com. IN TXT "v=DMARC1;p=none;sp=quarantine;pct=100;rua=mailto:dmarcreports@grantrules.com"`


## Troubleshooting

### Can't connect to mailserver outside of network
Some residential ISPs block service ports like 25


## Resources


* SPF RFC: https://tools.ietf.org/html/rfc7208
* DKIM RFC: https://tools.ietf.org/html/rfc6376
* DMARC RFC: https://tools.ietf.org/html/rfc7489
* SASL RFC: https://tools.ietf.org/html/rfc4422
* SMTP RFC: https://tools.ietf.org/html/rfc5321
* http://postfix.state-of-mind.de/patrick.koetter/smtpauth/postfix_tls_support.html
* https://www.bettercloud.com/monitor/spf-dkim-dmarc-email-security/
* https://help.ubuntu.com/community/Postfix/DKIM
* https://www.upcloud.com/support/secure-postfix-using-lets-encrypt/
* https://www.safaribooksonline.com/library/view/postfix-the-definitive/0596002122/
* https://wiki.debian.org/PostfixAndSASL
* http://www.postfix.org/SASL_README.html
* http://www.postfix.org/VIRTUAL_README.html