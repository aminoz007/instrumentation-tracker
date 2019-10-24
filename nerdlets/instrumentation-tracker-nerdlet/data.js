import { infraConfig } from './config';
import { NerdGraphQuery } from 'nr1';

const getHostCount = () => {

    const listAccounts = []
    infraConfig.forEach(group => {
        group.accounts.forEach(account => {
            listAccounts.push(account.accountId)
        })
    })
    return new Promise(function(resolve, reject) {
        const dataPromises = _buildQuery(listAccounts)
        Promise.all(dataPromises).then(values => {
            const countsList = []
            values.forEach(value => {
                countsList.push.apply(countsList,_extractCountByAcct(value))
            })
            resolve(_mergeResultWithConfig(countsList))
        })
        .catch((error) => reject(error))
    }) 
}


const _buildQuery = (listAccounts) => {

    let graphQueryList = listAccounts.map((accountId,index) => {
        const nrqlQuery = `SELECT filter(uniqueCount(entityGuid), where provider is not null) as 'cloud', filter(uniqueCount(entityGuid), where provider is null) as 'onPrem', uniqueCount(entityGuid) as 'total' FROM SystemSample where agentName='Infrastructure'`
        return `account${index}:account(id: ${accountId}) {
            id
            nrql(query: "${nrqlQuery}") {
            results
            }
        }`
    })

    // GraphQL Queries has a complexity limit. To avoid reaching this limit we will split
    // requests to a max size of 25 per batch
    const requests = []
    while(graphQueryList.length) {
        let graphQ = graphQueryList.splice(0,25).reduce((acc,query) => acc.concat(query),'')
        graphQ = `{
            actor {
              ${graphQ}
            }}`
        requests.push(graphQ)
    }
    console.log(requests)

    const promises = []
    requests.forEach(request => {
        promises.push(NerdGraphQuery.query({ query: request, fetchPolicyType:NerdGraphQuery.FETCH_POLICY_TYPE.NO_CACHE }))
    })

    return promises
}

const _extractCountByAcct = (queryResult) => {
    const results = []
    if (queryResult.data) {
        Object.keys(queryResult.data.actor).map(account => {
            if(account.startsWith('account')){   // Appolo returns things like __typname, we have to ignore them
                const counts = queryResult.data.actor[account].nrql.results
                const accountId = queryResult.data.actor[account].id
                if (counts.length) {
                    const parsedData = {accountId:accountId, counts:counts[0]} // NRQL query used here returns always 1 object ==> flatten
                    results.push(parsedData)
                }
            } 
        })
    }
    return results
}
// parsedQueryRes has this format
// [{accountId: 95174, counts: {cloud: 40, onPrem: 17, total: 57}}, {accountId: 2048290, counts: {cloud: 36, onPrem: 4, total: 40}}, etc...]
const _mergeResultWithConfig = (parsedQueryRes) => {
    const accountsIds = parsedQueryRes.map(res => res.accountId)
    const updatedConfig = infraConfig.map(group => {        // For each group we update the accounts by adding the count of instrumented host onprem/cloud
        let instrTotalOnPrem = 0
        let instrTotalCloud = 0
        group.accounts.map(account => {
            const index = accountsIds.indexOf(account.accountId)
            if (index > -1) {
                account['instrOnPremHostCount'] = parsedQueryRes[index]['counts']['onPrem']
                account['instrCloudHostCount'] = parsedQueryRes[index]['counts']['cloud']

                instrTotalOnPrem += parsedQueryRes[index]['counts']['onPrem']
                instrTotalCloud += parsedQueryRes[index]['counts']['cloud']
            }
            return account
        })
        group['instrOnPremHostCount'] = instrTotalOnPrem
        group['instrCloudHostCount'] = instrTotalCloud
        return group
    })
    console.log(updatedConfig)
    return updatedConfig
}

export { getHostCount }