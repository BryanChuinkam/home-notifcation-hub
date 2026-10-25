on run {action, vmId}
    with timeout of 30 seconds
        tell application "UTM"
            if action is "quit-idle" then
                repeat with candidate in every virtual machine
                    if status of candidate is not stopped then return "UTM left open: another VM is active."
                end repeat
                quit
                return "UTM closed."
            end if
            set guest to virtual machine id vmId
            if action is "status" then
                return (status of guest) as text
            else if action is "start" then
                start guest
            else if action is "addresses" then
                set addresses to query ip guest
                set AppleScript's text item delimiters to linefeed
                return addresses as text
            else if action is "shutdown" then
                -- Request a guest OS powerdown; never use UTM's default force stop.
                stop guest by request
            else
                error "Unsupported stack operation"
            end if
        end tell
    end timeout
end run
