const updatedMembersList = (membersList, usersToRemove) => {
    const updatedList = membersList.filter(member => {
        return !usersToRemove.includes(member.id)
    })
    return updatedList
}

export default updatedMembersList;