## [Creating a commit with multiple authors](#creating-a-commit-with-multiple-authors)

Add one or more `Co-authored-by` trailers to a commit message to attribute a commit to multiple authors.

### [Required co-author information](#required-co-author-information)

Before adding a co-author, get the email address they want used in the trailer. For the commit to count as a contribution, use an email address associated with their account on GitHub.com.

If a co-author keeps their email address private, use their GitHub-provided `no-reply` email. See [Setting your commit email address](/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address).

### [Creating co-authored commits using GitHub Desktop](#creating-co-authored-commits-using-github-desktop)

You can use GitHub Desktop to create a commit with a co-author. See [Committing and reviewing changes to your project in GitHub Desktop](/en/desktop/making-changes-in-a-branch/committing-and-reviewing-changes-to-your-project-in-github-desktop#write-a-commit-message-and-push-your-changes) and [GitHub Desktop](https://desktop.github.com).

### [Creating co-authored commits on the command line](#creating-co-authored-commits-on-the-command-line)

1.  Collect the name and email address for each co-author. If a person chooses to keep their email address private, you should use their GitHub-provided `no-reply` email to protect their privacy.

2.  Type your commit message and a short, meaningful description of your changes. After your commit description, add an empty line instead of a closing quotation mark.

    ``` shell
    $ git commit -m "Refactor usability tests.
    >
    >
    ```

3.  Add one `Co-authored-by: name <name@example.com>` line for each co-author, then add the closing quotation mark.

    ``` shell
    $ git commit -m "Refactor usability tests.
    >
    > Co-authored-by: NAME <NAME@EXAMPLE.COM>
    > Co-authored-by: ANOTHER-NAME <ANOTHER-NAME@EXAMPLE.COM>"
    ```

The new commit and message appear on GitHub.com after you push. See [Pushing commits to a remote repository](/en/get-started/using-git/pushing-commits-to-a-remote-repository).
