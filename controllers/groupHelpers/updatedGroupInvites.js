const updatedGroupInvites = (inviteList, groupToRemove) => {
    const updatedList = inviteList.filter(invite => {
        return groupToRemove != invite.groupId
    })
    return updatedList
}

export default updatedGroupInvites;